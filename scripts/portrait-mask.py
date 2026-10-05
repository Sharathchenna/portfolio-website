"""One-off: subject mask for the hero portrait (assets/source/me-mask.png).

The mask lets the dither treat figure and background differently: a paper
"halo" is cut around the silhouette and the busy forest is pushed back.
Only needed if assets/source/me.png changes. Requires: pip install "rembg[cpu]"
Then run `npm run assets` to rebuild everything in /public.
"""
from PIL import Image
from rembg import new_session, remove

photo = Image.open("assets/source/me.png").convert("RGB")
mask = remove(photo, session=new_session("isnet-general-use"), only_mask=True)
mask.save("assets/source/me-mask.png")
print("wrote assets/source/me-mask.png", mask.size)
