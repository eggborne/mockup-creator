IMAGE_SEGMENTS = [];
COLOR_INPUTS = [];
ALPHA_INPUTS = [];
LOCKED_COLOR_INDEXES = [];

let app;

const initializeImages = () => {
  const containerWidth = document.getElementById('image-container').offsetWidth;
  const containerHeight = document.getElementById('image-container').offsetHeight;

  app = new PIXI.Application({
    width: containerWidth,
    height: containerHeight,
    backgroundColor: '#565656',
    // resolution: window.devicePixelRatio || 1,
  });

  document.getElementById('image-container').appendChild(app.view);

  const texture0 = PIXI.Texture.from('./assets/original.png');
  const texture1 = PIXI.Texture.from('./assets/monochrome/area1.png');
  const texture2 = PIXI.Texture.from('./assets/monochrome/area2.png');
  const texture3 = PIXI.Texture.from('./assets/monochrome/area3.png');
  const texture4 = PIXI.Texture.from('./assets/monochrome/area4.png');

  const spriteOrig = new PIXI.Sprite(texture0);
  const sprite1 = new PIXI.Sprite(texture1);
  const sprite2 = new PIXI.Sprite(texture2);
  const sprite3 = new PIXI.Sprite(texture3);
  const sprite4 = new PIXI.Sprite(texture4);
  const overlay1 = new PIXI.Sprite(texture1);
  const overlay2 = new PIXI.Sprite(texture2);
  const overlay3 = new PIXI.Sprite(texture3);
  const overlay4 = new PIXI.Sprite(texture4);

  IMAGE_SEGMENTS = [
    new PIXI.Container(),
    new PIXI.Container(),
    new PIXI.Container(),
    new PIXI.Container(),
  ];

  IMAGE_SEGMENTS[0].addChild(sprite1, overlay1);
  IMAGE_SEGMENTS[1].addChild(sprite2, overlay2);
  IMAGE_SEGMENTS[2].addChild(sprite3, overlay3);
  IMAGE_SEGMENTS[3].addChild(sprite4, overlay4);


  for (const seg of IMAGE_SEGMENTS) {
    seg.children.forEach(c => {
      c.width = containerWidth;
      c.height = containerHeight;
    });
    // alterSprite(seg, '#aaaaaa', 0.5);
    getRandomColors();
  }

  app.stage.addChild(...IMAGE_SEGMENTS);
}

const alterSprite = (segment, color, alpha) => {
  const sprite = segment.children[0];
  const overlay = segment.children[1];
  overlay.tint = color;
  overlay.alpha = alpha;
};

const addInputListeners = () => {
  COLOR_INPUTS = [
    document.getElementById("color-input-1"),
    document.getElementById("color-input-2"),
    document.getElementById("color-input-3"),
    document.getElementById("color-input-4")
  ];

  ALPHA_INPUTS = [
    document.getElementById("alpha-input-1"),
    document.getElementById("alpha-input-2"),
    document.getElementById("alpha-input-3"),
    document.getElementById("alpha-input-4")
  ];

  COLOR_INPUTS.forEach((input, index) => {
    input.addEventListener("input", (event) => {
      const color = event.target.value;
      const alpha = ALPHA_INPUTS[index].value / 1000;
      const segment = IMAGE_SEGMENTS[index];
      alterSprite(segment, color, alpha);
    });
  });

  ALPHA_INPUTS.forEach((input, index) => {
    input.addEventListener("input", (event) => {
      const alpha = event.target.value / 1000;
      const color = COLOR_INPUTS[index].value;
      const segment = IMAGE_SEGMENTS[index];
      alterSprite(segment, color, alpha);
    });
  });
}

const saveImage = () => {
  const generateUniqueFilename = () => {
    let filename = 'mockup_image';
    COLOR_INPUTS.forEach((input, index) => {
      const color = input.value.replace('#', '');
      const alpha = Math.round(ALPHA_INPUTS[index].value / 10); // Convert to 0-100 range
      filename += `_${color}-${alpha}`;
    });
    return `${filename}.jpg`;
  };

  const fileName = generateUniqueFilename();
  const renderer = app.renderer;

  const tempCanvas = document.createElement('canvas');
  const tempContext = tempCanvas.getContext('2d');

  tempCanvas.width = app.view.width;
  tempCanvas.height = app.view.height;

  renderer.render(app.stage);

  tempContext.drawImage(renderer.view, 0, 0);

  const dataURL = tempCanvas.toDataURL('image/jpeg', 1);

  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataURL;
  link.click();
};

const getRandomHexColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const getRandomAlpha = () => {
  return parseFloat((Math.random() * (0.9 - 0.1) + 0.1).toFixed(2));
};

const getRandomColors = () => {
  for (let i = 0; i < IMAGE_SEGMENTS.length; i++) {
    if (LOCKED_COLOR_INDEXES.includes(i)) continue;
    const color = getRandomHexColor();
    const alpha = getRandomAlpha();
    alterSprite(IMAGE_SEGMENTS[i], color, alpha);
    COLOR_INPUTS[i].value = color;
    ALPHA_INPUTS[i].value = alpha * 1000;
  }
};

const handleCheckColor = (e, index) => {
  const checked = e.target.checked;
  if (checked) {
    LOCKED_COLOR_INDEXES.push(index);
  } else {
    LOCKED_COLOR_INDEXES.splice(LOCKED_COLOR_INDEXES.indexOf(index), 1);
  }
};

const apiUrl = 'http://localhost:3000/generateColors';

const fetchColors = async (requestBody) => {
  const result = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  const data = result.json();
  if (data.error) {
    console.error('Error:', data.error);
  } else {
    console.log('New colors:', data.newColors);
  }
  return data.newColors;
};

const generateColors = async () => {
  const lockedColors = [];
  LOCKED_COLOR_INDEXES.forEach(ind => {
    lockedColors.push(COLOR_INPUTS[ind].color);
  });
  const requestBody = {
    colors: lockedColors,
    options: {
      amount: COLOR_INPUTS.length - LOCKED_COLOR_INDEXES.length
    }
  };
  const newColors = await fetchColors(requestBody);
  return newColors;
};

document.addEventListener("DOMContentLoaded", () => {
  addInputListeners();
  document.documentElement.style.setProperty('--actual-height', `${window.innerHeight}px`);
  initializeImages();
});
