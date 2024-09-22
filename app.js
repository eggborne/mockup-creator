import { initializeRenderer, saveImage } from "./pixi.js";
// import handleDriveUpload from "./googledrive.js";

const ORIGINAL_IMAGE = {
  aspectRatio: 540/1548,
  originalPath: './assets/original.png',
  segments: [
    { filePath: './assets/monochrome/area1.png', color: '#b77134', alpha: 1 },
    { filePath: './assets/monochrome/area2.png', color: '#ab9269', alpha: 1 },
    { filePath: './assets/monochrome/area3.png', color: '#ffe5b8', alpha: 1 },
    { filePath: './assets/monochrome/area4.png', color: '#000000', alpha: 1 },
  ],
};

const protocol = 'http:'
const host = location.hostname;


const API_URL = `${protocol}//${host}:3000/generateColors`;

let IMAGE_SEGMENTS = [];
let COLOR_INPUTS = [];
let ALPHA_INPUTS = [];
let LOCKED_COLOR_INDEXES = [];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

document.documentElement.style.setProperty('--actual-height', `${window.innerHeight}px`);
document.documentElement.style.setProperty('--image-aspect-ratio', ORIGINAL_IMAGE.aspectRatio);

const alterSprite = (segment, color, alpha) => {
  const overlay = segment.children[1];
  overlay.tint = color;
  overlay.alpha = alpha;
};

const buildHTML = () => {
  for (let i = 0; i < ORIGINAL_IMAGE.segments.length; i++) {
    const controlHTML = `
    <div class="color-control">
      <label class="fancy-checkbox">
        <input type="checkbox" id="checkbox-${i}" />
        <span class="checkmark"></span>
      </label>
      <input type="color" id="color-input-${i}">
      <input type="range" min="0" max="1" step="0.01" value="0.5" id="alpha-input-${i}">
    </div>
    `;
    document.getElementById('color-control-area').innerHTML += (controlHTML);
  }
  for (let i = 0; i < ORIGINAL_IMAGE.segments.length; i++) {
    COLOR_INPUTS.push(document.getElementById(`color-input-${i}`));
    ALPHA_INPUTS.push(document.getElementById(`alpha-input-${i}`));
  }
};

const addInputListeners = () => {
  COLOR_INPUTS.forEach((input, index) => {
    input.addEventListener("input", (event) => {
      const color = event.target.value;
      const alpha = ALPHA_INPUTS[index].value;
      const segment = IMAGE_SEGMENTS[index];
      alterSprite(segment, color, alpha);
    });
  });

  ALPHA_INPUTS.forEach((input, index) => {
    input.addEventListener("input", (event) => {
      const alpha = event.target.value;
      const color = COLOR_INPUTS[index].value;
      const segment = IMAGE_SEGMENTS[index];
      alterSprite(segment, color, alpha);
    });
  });

  const handleSaveImage = () => {
    let fileName = 'mockup_image';
    COLOR_INPUTS.forEach((input, index) => {
      const color = input.value.replace('#', '');
      const alpha = Math.round(ALPHA_INPUTS[index].value * 100);
      fileName += `_${color}-${alpha}`;
    });
    saveImage(`${fileName}.jpg`);
  };

  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
    checkbox.addEventListener('change', (event) => handleCheckColor(event, index));
  });

  document.getElementById('random-button').addEventListener('click', getRandomColors);
  if (location.protocol === 'http:') {
    document.getElementById('ai-button').addEventListener('click', generateColors);
  } else {
    document.getElementById('ai-button').disabled = true;
  }
  document.getElementById('download-button').addEventListener('click', handleSaveImage);
  // document.getElementById('drive-button').addEventListener('click', handleDriveUpload);
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

const convertColorWithAlpha = ({ color, alpha }) => {
  const colorHex = color.replace('#', '');
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `#${colorHex}${alphaHex}`;
};

const convertHexToColorObject = (hex) => {
  hex = hex.replace(/^#/, '');
  if (hex.length !== 8) {
    hex = hex + 'ff';
  }
  const color = '#' + hex.slice(0, 6);
  const alpha = parseInt(hex.slice(6), 16) / 255;
  const roundedAlpha = Math.round(alpha * 100) / 100;
  return { color, alpha: roundedAlpha };
};

const getRandomColors = () => {
  for (let i = 0; i < IMAGE_SEGMENTS.length; i++) {
    if (LOCKED_COLOR_INDEXES.includes(i)) continue;
    const color = getRandomHexColor();
    const alpha = getRandomAlpha();
    alterSprite(IMAGE_SEGMENTS[i], color, alpha);
    COLOR_INPUTS[i].value = color;
    ALPHA_INPUTS[i].value = alpha;
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

const fetchColors = async (requestBody) => {
  const result = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  const data = await result.json();
  if (data.error) {
    console.error('Error:', data.error);
  } else {
    return data;
  }
};

const generateColors = async () => {
  document.getElementById('ai-button').classList.add('busy');
  document.getElementById('color-control-area').classList.add('busy');

  const colorList = [];
  let randomLockedIndex; // for if none provided
  let randomLockedColorObj;
  if (LOCKED_COLOR_INDEXES.length === 0) {
    randomLockedIndex = randomInt(0, COLOR_INPUTS.length - 1);
    randomLockedColorObj = {
      color: COLOR_INPUTS[randomLockedIndex].value,
      alpha: ALPHA_INPUTS[randomLockedIndex].value
    };
    colorList.push(randomLockedColorObj);
  } else {
    for (const index of LOCKED_COLOR_INDEXES) {
      const colorObj = {
        color: COLOR_INPUTS[index].value,
        alpha: ALPHA_INPUTS[index].value
      }
      colorList.push(colorObj);
    }
  }
  const requestBody = {
    colorList,
    options: {
      total: COLOR_INPUTS.length
    }
  };
  const { newColors, tokensUsed } = await fetchColors(requestBody);
  console.log('tokensUsed', tokensUsed)
  console.log('got newColors!', newColors);
  if (randomLockedColorObj) {
    newColors.push(randomLockedColorObj);
    console.log('now newColors is', newColors);
  }
  let colorsAdded = 0;
  for (let i = 0; i < IMAGE_SEGMENTS.length; i++) {
    if (!LOCKED_COLOR_INDEXES.includes(i) || randomLockedIndex === i) {
      const { color, alpha } = newColors[colorsAdded];
      alterSprite(IMAGE_SEGMENTS[i], color, alpha);
      COLOR_INPUTS[i].value = color;
      ALPHA_INPUTS[i].value = alpha;
      colorsAdded++;
    }
  }
  document.getElementById('ai-button').classList.remove('busy');
  document.getElementById('color-control-area').classList.remove('busy');
};

document.addEventListener("DOMContentLoaded", () => {
  buildHTML();
  addInputListeners();
  const containerWidth = document.getElementById('image-container').offsetWidth;
  const containerHeight = document.getElementById('image-container').offsetHeight;
  console.log('cont size', containerWidth, containerHeight)
  IMAGE_SEGMENTS = initializeRenderer(
    containerWidth,
    containerHeight,
    ORIGINAL_IMAGE.segments
  );
  for (let i = 0; i < IMAGE_SEGMENTS.length; i++) {
    const { color, alpha } = ORIGINAL_IMAGE.segments[i];
    alterSprite(IMAGE_SEGMENTS[i], color, alpha);
    COLOR_INPUTS[i].value = color;
    ALPHA_INPUTS[i].value = alpha;
  }
});
