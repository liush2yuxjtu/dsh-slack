"""Check the delivered files, real-response provenance and actual-pixel text size."""
import argparse
import csv
import hashlib
import io
import json
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageOps, ImageStat


ROOT = Path(__file__).resolve().parent.parent


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=120).stdout


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def probe(path):
    return json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))


def frame(path, at, vf=None):
    args = ['ffmpeg', '-v', 'error', '-ss', str(at), '-i', str(path), '-frames:v', '1']
    if vf:
        args += ['-vf', vf]
    raw = subprocess.run([*args, '-f', 'image2pipe', '-vcodec', 'png', '-'], check=True, capture_output=True, timeout=120).stdout
    return Image.open(io.BytesIO(raw)).convert('RGB')


def normalized(text):
    return re.sub(r'[^\w\u3400-\u9fff]', '', text).lower()


def ocr_target(image, region, expected, language, tessdata):
    crop = image.crop(region)
    scale = 3
    prepared = crop.resize((crop.width * scale, crop.height * scale), Image.Resampling.LANCZOS)
    attempts, match = [], None
    for inverted in (False, True):
        for psm in (6, 11):
            target = ImageOps.invert(prepared) if inverted else prepared
            buffer = io.BytesIO()
            target.save(buffer, format='PNG')
            command = ['tesseract', 'stdin', 'stdout', '-l', 'eng' if language == 'en' else 'chi_sim+eng', '--psm', str(psm)]
            if tessdata:
                command += ['--tessdata-dir', str(tessdata)]
            result = subprocess.run([*command, '-c', 'tessedit_create_tsv=1'], input=buffer.getvalue(), check=True, capture_output=True, timeout=60)
            assert result.stdout.startswith(b'level\t'), result.stderr.decode()
            words = [row for row in csv.DictReader(io.StringIO(result.stdout.decode()), delimiter='\t')
                     if row['level'] == '5' and row.get('text', '').strip()]
            attempts.append({'psm': psm, 'inverted': inverted, 'text': ' '.join(word['text'] for word in words)})
            for start in range(len(words)):
                for end in range(start + 1, min(len(words), start + 8) + 1):
                    selected = words[start:end]
                    if normalized(''.join(word['text'] for word in selected)) != normalized(expected):
                        continue
                    x0 = min(int(word['left']) for word in selected) // scale
                    y0 = min(int(word['top']) for word in selected) // scale
                    x1 = (max(int(word['left']) + int(word['width']) for word in selected) + scale - 1) // scale
                    y1 = (max(int(word['top']) + int(word['height']) for word in selected) + scale - 1) // scale
                    candidate = (x0, y0, x1, y1)
                    # PSM 6 can attach a selection border to the first word. Use the
                    # tightest independently recognized box, then measure actual ink.
                    if match is None or (x1 - x0) * (y1 - y0) < (match[2] - match[0]) * (match[3] - match[1]):
                        match = candidate
    assert match, f'OCR could not find {expected!r} in delivered pixels: {attempts}'
    ink = ImageOps.grayscale(crop.crop(match))
    heights, start = [], None
    columns = [any(ink.getpixel((x, y)) < 140 for y in range(ink.height)) for x in range(ink.width)]
    for x, active in enumerate([*columns, False]):
        if active and start is None:
            start = x
        if not active and start is not None:
            rows = [y for y in range(ink.height) if any(ink.getpixel((px, y)) < 140 for px in range(start, x))]
            if rows and max(rows) - min(rows) >= 4:
                heights.append(max(rows) - min(rows) + 1)
            start = None
    assert heights, f'No actual text ink for {expected!r}'
    ink_rows = [y for y in range(ink.height) if any(ink.getpixel((x, y)) < 140 for x in range(ink.width))]
    # Latin capitals and x-height use the actual glyph-column ink. CJK uses its full glyph box.
    return {'text': expected, 'region': region, 'box': [match[0] + region[0], match[1] + region[1], match[2] + region[0], match[3] + region[1]],
            'ink_heights_px': heights, 'cap_height_px': heights[0], 'x_height_px': min(heights),
            'cjk_glyph_height_px': max(ink_rows) - min(ink_rows) + 1, 'ocr_passes': attempts}


def verify(directory, tessdata, write):
    qa = json.loads((directory / 'qa.json').read_text())
    recording = json.loads((directory / 'recording.json').read_text())
    lang = recording['language']
    assert lang in ('en', 'zh') and recording['language_check']['dom'] == 'pass'
    assert recording['liveModel'] is True
    for key in ('mockedService', 'scriptedModel', 'seededAssistantMessages', 'seededTodoEvents'):
        assert recording[key] is False
    assert recording['source']['environment'] == 'repository-build'
    for name, expected in recording['source']['sourceHashes'].items():
        assert digest(ROOT / name) == expected, f'The recorded UI differs from {name}'
    assert recording['calls'] and all(call['httpStatus'] == 200 and call['responseId'] and call['complete']
                                      and call['usage']['output_tokens'] > 0 for call in recording['calls'])
    assert len(recording['sessions']) == 2 and qa['result_hold_s'] >= 3
    for name, expected in qa['outputs'].items():
        assert digest(directory / name) == expected['sha256']
        assert (directory / name).stat().st_size == expected['bytes']
    assert digest(directory / 'full-demo.mp4') == qa['raw_sha256']
    full_probe = probe(directory / 'full-demo.mp4')
    start, end = qa['excerpt_source_s']
    assert abs(end - start - 8) < 0.001 and end <= float(full_probe['format']['duration'])
    metadata = probe(directory / 'feature-8s.mp4')
    assert abs(float(metadata['format']['duration']) - 8) < 0.001
    video = metadata['streams'][0]
    assert len(metadata['streams']) == 1 and video['codec_type'] == 'video'
    assert video['codec_name'] == 'h264' and video['pix_fmt'] == 'yuv420p'
    assert video['color_range'] == 'tv' and video['r_frame_rate'] == '30/1'
    assert int(video['nb_frames']) == 240
    run(['ffmpeg', '-v', 'error', '-i', str(directory / 'feature-8s.mp4'), '-f', 'null', '-'])
    with Image.open(directory / 'feature-8s.gif') as gif:
        assert gif.info['loop'] == 0
        duration, gif_frames = 0, gif.n_frames
        for index in range(gif.n_frames):
            gif.seek(index)
            duration += gif.info.get('duration', 0)
        assert abs(duration - 8000) <= 100 and gif_frames >= 90
        gif.seek(min(60, gif_frames - 1))
        gif_still = gif.convert('RGB')
    assert (directory / 'feature-8s.gif').stat().st_size <= 3 * 1024 * 1024
    still = frame(directory / 'feature-8s.mp4', 5)
    crop = qa['crop_source_pixels']
    original = frame(directory / 'full-demo.mp4', start + 5,
                     f"crop={crop['width']}:{crop['height']}:{crop['x']}:{crop['y']},scale={still.width}:-2:flags=lanczos")
    raw_error = sum(ImageStat.Stat(ImageChops.difference(original, still)).mean) / 3
    gif_error = sum(ImageStat.Stat(ImageChops.difference(gif_still, still)).mean) / 3
    assert raw_error < 3 and gif_error < 4, 'The excerpt differs from the actual full recording.'
    targets = [('hero', (550, 90, 1200, 150), 'Plan' if lang == 'en' else '规划发布', 16),
               ('operated_label', (15, 215, 510, 290), 'Plan' if lang == 'en' else '规划发布', 9),
               ('secondary_label', (560, 690, 1220, 880), 'Publish' if lang == 'en' else '发布更新', 7)]
    measurements = {}
    for format_name, image in [('mp4', still), ('gif', gif_still)]:
        measurements[format_name] = {}
        for role, region, text, minimum in targets:
            result = ocr_target(image, region, text, lang, tessdata)
            metric = 'cjk_glyph_height_px' if lang == 'zh' else 'cap_height_px' if role == 'hero' else 'x_height_px'
            assert result[metric] >= minimum, f'{format_name} {role}: {result[metric]}px < {minimum}px'
            result.update(metric=metric, measured_px=result[metric], minimum_px=minimum, pass_=True)
            measurements[format_name][role] = result
    result = {'status': 'PASS', 'language': lang, 'actual_api_responses': len(recording['calls']),
              'mp4_seconds': float(metadata['format']['duration']), 'mp4_frames': 240, 'gif_seconds': duration / 1000,
              'gif_frames': gif_frames, 'resolution': [video['width'], video['height']], 'result_hold_s': qa['result_hold_s'],
              'continuous_source_mean_pixel_error': raw_error, 'gif_mean_pixel_error': gif_error, 'legibility': measurements}
    if write:
        output = directory / 'verify'
        output.mkdir(exist_ok=True)
        (output / 'technical-qa.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
        still.save(output / 'mp4-frame.png')
        strip = Image.new('RGB', (1280, 260), 'white')
        draw = ImageDraw.Draw(strip)
        for index, (role, region, _, _) in enumerate(targets):
            draw.text((8, index * 85 + 5), role, fill='black')
            x0, y0, x1, y1 = measurements['mp4'][role]['box']
            strip.paste(still.crop((x0 - 8, y0 - 8, x1 + 8, y1 + 8)), (150, index * 85))
        strip.save(output / 'legibility-strip.png')
    print(json.dumps({key: value for key, value in result.items() if key != 'legibility'}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directories', type=Path, nargs='+')
    parser.add_argument('--tessdata', type=Path)
    parser.add_argument('--write', action='store_true', help='Save the measured evidence beside the files.')
    args = parser.parse_args()
    for directory in args.directories:
        verify(directory.resolve(), args.tessdata, args.write)


if __name__ == '__main__':
    main()
