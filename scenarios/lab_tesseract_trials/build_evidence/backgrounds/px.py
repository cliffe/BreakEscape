import sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, 'tools')
from pixellab_pipeline import PixelLab, b64_image, decode_image, find_images
src, out, prompt = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3]
strengths = [int(x) for x in sys.argv[4].split(',')]
seed0 = int(sys.argv[5])
im = Image.open(src).convert('RGBA')
w, h = im.size; s = min(w, h)
im = im.crop(((w-s)//2, (h-s)//2, (w-s)//2+s, (h-s)//2+s)).resize((320, 320), Image.LANCZOS)
api = PixelLab()
for i, st in enumerate(strengths):
    body = {"description": prompt, "image_size": {"width": 320, "height": 320},
            "init_image": b64_image(im), "init_image_strength": st, "text_guidance_scale": 8, "seed": seed0 + i}
    resp = api.post("/create-image-pixflux", body)
    p = out / f"{src.stem}_px_s{st}.png"
    decode_image(find_images(resp)[0]).convert('RGB').save(p)
    print(p.name, resp.get("usage"))
