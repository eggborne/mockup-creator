let pixi;

export const initializeRenderer = (containerWidth, containerHeight, segments) => {
  const IMAGE_SEGMENTS = [];
  pixi = new PIXI.Application({
    width: containerWidth,
    height: containerHeight,
    backgroundColor: '#565656',
    // resolution: location.protocol === 'http:' ? 1 : window.devicePixelRatio,
  });

  document.getElementById('image-container').appendChild(pixi.view);

  for (const segment of segments) {
    const container = new PIXI.Container();
    const texture = PIXI.Texture.from(segment.filePath);
    const sprite = new PIXI.Sprite(texture);
    const overlay = new PIXI.Sprite(texture);
    sprite.width = overlay.width = containerWidth;
    sprite.height = overlay.height = containerHeight;
    container.addChild(sprite, overlay);
    IMAGE_SEGMENTS.push(container);
  }
  pixi.stage.addChild(...IMAGE_SEGMENTS);
  return IMAGE_SEGMENTS;
};

export const saveImage = (fileName) => {
  const renderer = pixi.renderer;
  const tempCanvas = document.createElement('canvas');
  const tempContext = tempCanvas.getContext('2d');
  tempCanvas.width = pixi.view.width;
  tempCanvas.height = pixi.view.height;
  renderer.render(pixi.stage);
  tempContext.drawImage(renderer.view, 0, 0);
  const dataURL = tempCanvas.toDataURL('image/jpeg', 1);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataURL;
  link.click();
};