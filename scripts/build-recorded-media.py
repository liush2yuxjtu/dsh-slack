import argparse
import hashlib
import json
import shutil
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=240).stdout


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def probe(path):
    return json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))


def ffmpeg(args):
    run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-n', *args])


def sheet(paths, output, columns=4, width=400):
    images = []
    for path in paths:
        image = Image.open(path).convert('RGB')
        image = image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
        images.append(image)
    height = max(image.height for image in images)
    canvas = Image.new('RGB', (columns * width, (height + 22) * ((len(images) + columns - 1) // columns)), 'white')
    draw = ImageDraw.Draw(canvas)
    for index, image in enumerate(images):
        x, y = index % columns * width, index // columns * (height + 22)
        canvas.paste(image, (x, y + 22))
        draw.text((x + 5, y + 4), f'{index + 1}: {paths[index].stem}', fill='black')
    canvas.save(output)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('recording', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--start-offset', type=float, default=0,
                        help='Advance within the same immutable take; never change playback speed.')
    args = parser.parse_args()
    source, output = args.recording.resolve(), args.output.resolve()
    assert not output.exists(), 'Choose a new edits directory.'
    recording = json.loads((source / 'recording.json').read_text())
    assert recording['status'] == 'recorded'
    assert recording['liveModel'] and not recording['mockedService'] and not recording['scriptedModel']
    assert recording['source']['environment'] == 'repository-build'
    raw = source / 'raw/gt.mp4'
    raw_hash = digest(raw)
    metadata = probe(raw)
    stream = next(item for item in metadata['streams'] if item['codec_type'] == 'video')
    duration = float(metadata['format']['duration'])
    assert args.start_offset >= 0
    start = recording['excerpt']['start_s'] + args.start_offset
    assert start + 8 <= duration
    proof0, proof1 = recording['proof_interval_s']
    proof0 = max(start, proof0)
    proof1 = min(start + 8, proof1)
    assert start <= proof0 < proof1 <= start + 8 and proof1 - proof0 >= 3
    factor = stream['width'] / recording['runtime']['viewport']['width']
    crop = {key: round(value * factor) for key, value in recording['crop_css'].items()}
    assert crop['x'] + crop['width'] <= stream['width'] and crop['y'] + crop['height'] <= stream['height']
    output.mkdir(parents=True)
    (output / 'verify').mkdir()
    width = 1280
    prefix = f"crop={crop['width']}:{crop['height']}:{crop['x']}:{crop['y']},scale={width}:-2:flags=lanczos"
    short = output / 'feature-8s.mp4'
    ffmpeg(['-ss', str(start), '-i', str(raw), '-an', '-vf', prefix + ',setpts=PTS-STARTPTS,fps=30:start_time=0,format=yuv420p',
            '-frames:v', '240', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-color_range', 'tv', '-movflags', '+faststart', str(short)])
    short_probe = probe(short)
    video = next(item for item in short_probe['streams'] if item['codec_type'] == 'video')
    assert video['codec_name'] == 'h264' and video['pix_fmt'] == 'yuv420p'
    assert abs(float(short_probe['format']['duration']) - 8) <= 0.001
    gif = output / 'feature-8s.gif'
    filters = 'fps=12,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle'
    ffmpeg(['-i', str(short), '-filter_complex', filters, '-an', '-loop', '0', '-final_delay', '8', str(gif)])
    with Image.open(gif) as image:
        frames, elapsed = image.n_frames, 0
        loop = image.info.get('loop')
        for index in range(frames):
            image.seek(index)
            elapsed += image.info.get('duration', 0)
    assert frames > 50 and loop == 0 and abs(elapsed / 1000 - 8) <= 0.12
    assert gif.stat().st_size <= 3 * 1024 * 1024, 'The GIF exceeds 3 MiB. Choose a new framing or variant.'
    shutil.copy2(raw, output / 'full-demo.mp4')
    shutil.copy2(source / 'snapshot.png', output / 'snapshot.png')
    shutil.copy2(source / 'raw/frames.json', output / 'frames.json')
    shutil.copy2(source / 'markers.jsonl', output / 'markers.jsonl')
    shutil.copy2(source / 'native-events.json', output / 'native-events.json')
    shutil.copy2(source / 'recording.json', output / 'recording.json')
    ffmpeg(['-ss', '5', '-i', str(short), '-frames:v', '1', str(output / 'poster.png')])
    gif_frames = output / 'verify/gif-frames'
    gif_frames.mkdir()
    ffmpeg(['-ignore_loop', '1', '-i', str(gif), '-fps_mode', 'passthrough', str(gif_frames / 'frame-%03d.png')])
    paths = sorted(gif_frames.glob('*.png'))
    sampled = [paths[round((len(paths) - 1) * index / 15)] for index in range(16)]
    sheet(sampled, output / 'verify/contact-sheet.png', width=400)
    sheet([paths[min(len(paths) - 1, index * 12)] for index in range(8)], output / 'verify/interaction-strip.png', width=400)
    full_frames = []
    for index in range(12):
        target = output / 'verify' / f'full-{index:02d}.png'
        ffmpeg(['-ss', str(duration * index / 12), '-i', str(raw), '-frames:v', '1', str(target)])
        full_frames.append(target)
    sheet(full_frames, output / 'verify/full-contact-sheet.png', width=320)
    assert digest(raw) == raw_hash, 'The immutable original changed.'
    outputs = {name: {'sha256': digest(output / name), 'bytes': (output / name).stat().st_size}
               for name in ['feature-8s.mp4', 'feature-8s.gif', 'full-demo.mp4', 'snapshot.png', 'poster.png']}
    qa = {'status': 'needs-visual-review', 'metadata_pass': True, 'language': recording['language'],
          'source': recording['source'], 'source_environment': 'repository-build', 'mockedService': False,
          'raw_sha256': raw_hash, 'raw_duration_s': duration, 'excerpt_source_s': [start, start + 8],
          'result_hold_s': proof1 - proof0, 'crop_source_pixels': crop, 'delivered_width': width,
          'video': {'duration_s': float(short_probe['format']['duration']), 'codec': video['codec_name'], 'pix_fmt': video['pix_fmt'], 'width': video['width'], 'height': video['height']},
          'gif': {'duration_s': elapsed / 1000, 'frames': frames, 'loop': loop}, 'outputs': outputs, 'visual_review': None}
    (output / 'qa.json').write_text(json.dumps(qa, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'output': str(output), 'duration_s': 8, 'gif_bytes': gif.stat().st_size, 'result_hold_s': proof1 - proof0}))


if __name__ == '__main__':
    main()
