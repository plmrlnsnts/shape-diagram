import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Ellipse, Text, Transformer } from 'react-konva';

const ShapeComponents = { Ellipse, Rect, Text };
const ShapeDefaultXPosition = 200;
const ShapeDefaultYPosition = 200;
const ShapeDefaultFillColor = '#93c5fd';
const ShapeDefaultStrokeColor = '#60a5fa';

const RectIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24">
    <path fill="currentColor" d="M3,3H21V21H3V3M5,5V19H19V5H5Z" />
  </svg>
);

const EllipseIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12,6C16.41,6 20,8.69 20,12C20,15.31 16.41,18 12,18C7.59,18 4,15.31 4,12C4,8.69 7.59,6 12,6M12,4C6.5,4 2,7.58 2,12C2,16.42 6.5,20 12,20C17.5,20 22,16.42 22,12C22,7.58 17.5,4 12,4Z"
    />
  </svg>
);

const TextIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M9,7H15V9H13V17H11V9H9V7M5,3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3M5,5V19H19V5H5Z"
    />
  </svg>
);

const Icon = (props) => {
  const icons = {
    Rect: RectIcon,
    Ellipse: EllipseIcon,
    Text: TextIcon,
  };

  return createElement(icons[props.name], props);
};

const App = () => {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isEditingText, setIsEditingText] = useState(false);

  const transformerOptions = {
    rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
  };

  const updateShapeOptions = (id, options) => {
    const i = shapes.findIndex((s) => s.id === id);

    const newShape = JSON.parse(JSON.stringify(shapes[i]));
    Object.assign(newShape.options, options);

    const newShapes = [...shapes];
    newShapes.splice(i, 1, newShape);
    setShapes(newShapes);
  };

  const addShape = (component) => {
    const id = Date.now().toString();

    const newShape = {
      id,
      component,
      name: `${component} Shape`,
      options: {
        draggable: true,
        rotation: 0,
        strokeScaleEnabled: false,
        x: ShapeDefaultXPosition,
        y: ShapeDefaultYPosition,
      },
    };

    if (component === 'Text') {
      newShape.options.fontSize = 16;
      newShape.options.text = 'Type something';
    } else {
      newShape.options.width = 100;
      newShape.options.height = 100;
      newShape.options.fill = ShapeDefaultFillColor;
      newShape.options.stroke = ShapeDefaultStrokeColor;
    }

    const newShapes = [...shapes];
    newShapes.push(newShape);
    setShapes(newShapes);

    setSelectedId(newShape.id);
  };

  const duplicateShape = (id) => {
    const i = shapes.findIndex((s) => s.id === id);

    const newShape = JSON.parse(JSON.stringify(shapes[i]));
    newShape.id = Date.now().toString();
    newShape.options.x += 10;
    newShape.options.y += 10;

    const newShapes = [...shapes];
    newShapes.push(newShape);
    setShapes(newShapes);

    setSelectedId(newShape.id);
  };

  const deleteShape = (id) => {
    const i = shapes.findIndex((s) => s.id === id);

    const newShapes = [...shapes];
    newShapes.splice(i, 1);
    setShapes(newShapes);

    setSelectedId(null);
  };

  const moveShape = (id, coordinate, point) => {
    const i = shapes.findIndex((s) => s.id === id);

    const newShape = JSON.parse(JSON.stringify(shapes[i]));
    newShape.options[coordinate] += point;

    const newShapes = [...shapes];
    newShapes.splice(i, 1, newShape);
    setShapes(newShapes);
  };

  const handleShapeTransform = (e) => {
    if (e.target.getClassName() !== 'Text') return;

    e.target.setAttrs({
      width: e.target.width() * e.target.scaleX(),
      height: e.target.height() * e.target.scaleY(),
      scaleX: 1,
      scaleY: 1,
    });
  };

  const handleShapeTransformEnd = (e) => {
    const scaleX = e.target.scaleX();
    const scaleY = e.target.scaleY();

    e.target.scaleX(1);
    e.target.scaleY(1);

    updateShapeOptions(e.target.id(), {
      height: e.target.height() * scaleY,
      width: e.target.width() * scaleX,
      rotation: e.target.rotation(),
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleShapeDragEnd = (e) => {
    updateShapeOptions(e.target.id(), {
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleShapeDoubleClick = (e) => {
    if (e.target.getClassName() !== 'Text') return;

    const shapeNode = e.target;
    const transformerNode = transformerRef.current;

    shapeNode.hide();
    transformerNode.hide();

    setIsEditingText(true);

    const textPosition = e.target.getAbsolutePosition();
    const stageBox = stageRef.current.container().getBoundingClientRect();
    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = e.target.text();
    textarea.style.position = 'absolute';
    textarea.style.top = areaPosition.y + 'px';
    textarea.style.left = areaPosition.x + 'px';
    textarea.style.width = shapeNode.width() - shapeNode.padding() * 2 + 'px';
    textarea.style.height =
      shapeNode.height() - shapeNode.padding() * 2 + 5 + 'px';
    textarea.style.fontSize = shapeNode.fontSize() + 'px';
    textarea.style.width = e.target.width();
    textarea.style.border = '1px solid #94C4F1';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = shapeNode.lineHeight();
    textarea.style.fontFamily = shapeNode.fontFamily();
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = shapeNode.align();
    textarea.style.color = shapeNode.fill();

    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
      const px = 2 + Math.round(shapeNode.fontSize() / 20);
      textarea.style.transform = `translateY(-${px}px)`;
    }

    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 3 + 'px';

    textarea.focus();

    const calculateTextAreaWidth = () => {
      let newWidth =
        shapeNode.width() * shapeNode.getAbsoluteScale().x ||
        shapeNode.placeholder.length * shapeNode.fontSize();

      const userAgent = navigator.userAgent;
      const isFirefox = userAgent.toLowerCase().indexOf('firefox') > -1;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const isEdge = document.documentMode || /Edge/.test(userAgent);

      if (isFirefox || isSafari) {
        newWidth = Math.ceil(newWidth);
      } else if (isEdge) {
        newWidth += 1;
      }

      return newWidth;
    };

    const resizeTextArea = () => {
      textarea.style.width = calculateTextAreaWidth() + 'px';
      textarea.style.height = 'auto';
      textarea.style.height =
        textarea.scrollHeight + shapeNode.fontSize() + 'px';
    };

    const detachTextArea = (e) => {
      if (e.keyCode && e.keyCode !== 13) return;

      document.body.removeChild(textarea);

      shapeNode.show();
      transformerNode.show();
      transformerNode.forceUpdate();

      updateShapeOptions(shapeNode.id(), { text: textarea.value });
      setIsEditingText(false);
    };

    textarea.addEventListener('blur', detachTextArea);
    textarea.addEventListener('keydown', detachTextArea);
    textarea.addEventListener('keydown', resizeTextArea);
  };

  const handleCanvasClick = (e) => {
    if (isEditingText) return;

    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) setSelectedId(null);
  };

  const handleCanvasKeyDown = (e) => {
    if (e.target.matches('input,textarea')) return;
    if (selectedId === null) return;

    e.preventDefault();

    if (e.keyCode === 8) {
      deleteShape(selectedId);
    } else if (e.keyCode === 68 && (e.ctrlKey || e.metaKey)) {
      duplicateShape(selectedId);
    } else if (e.keyCode === 37) {
      moveShape(selectedId, 'x', -1);
    } else if (e.keyCode === 38) {
      moveShape(selectedId, 'y', -1);
    } else if (e.keyCode === 39) {
      moveShape(selectedId, 'x', 1);
    } else if (e.keyCode === 40) {
      moveShape(selectedId, 'y', 1);
    }
  };

  const selectedShape = useMemo(
    () => shapes.find((s) => s.id === selectedId),
    [shapes, selectedId]
  );

  useEffect(() => {
    setCanvasWidth(canvasRef.current.clientWidth);
    setCanvasHeight(canvasRef.current.clientHeight);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleCanvasKeyDown);
    return () => window.removeEventListener('keydown', handleCanvasKeyDown);
  });

  useEffect(() => {
    if (stageRef.current === null) return;
    if (transformerRef.current === null) return;
    if (selectedId === null) return;

    const nodes = stageRef.current.find(`#${selectedId}`);
    transformerRef.current.nodes(nodes);
    transformerRef.current.getLayer().batchDraw();
  }, [selectedId]);

  return (
    <div className="flex min-h-screen focus:outline-none">
      <div className="w-56 shrink-none border-r">
        <div className="py-2">
          <h6 className="px-4 py-2 text-sm font-medium">Components</h6>
          {shapes.map((shape) => (
            <button
              key={shape.id}
              type="button"
              onClick={() => setSelectedId(shape.id)}
              className={[
                'w-full px-4 py-2 flex items-center text-sm space-x-4',
                selectedId !== shape.id &&
                  'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                selectedId === shape.id && 'text-gray-900 bg-blue-50',
              ].join(' ')}
            >
              <Icon
                name={shape.component}
                className={[
                  'w-4 h-4',
                  selectedId !== shape.id && 'text-gray-400',
                  selectedId === shape.id && 'text-gray-900',
                ].join(' ')}
              />
              <span>{shape.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 bg-gray-200 relative" ref={canvasRef}>
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white shadow-sm overflow-hidden divide-x rounded-md flex z-10">
          <button
            onClick={() => addShape('Rect')}
            className="flex items-center px-2 py-1 text-sm hover:bg-gray-100"
          >
            <RectIcon className="w-4 h-4 text-gray-500 mr-2" />
            <span>Rectangle</span>
          </button>
          <button
            onClick={() => addShape('Ellipse')}
            className="flex items-center px-2 py-1 text-sm hover:bg-gray-100"
          >
            <EllipseIcon className="w-4 h-4 text-gray-500 mr-2" />
            <span>Ellipse</span>
          </button>
          <button
            onClick={() => addShape('Text')}
            className="flex items-center px-2 py-1 text-sm hover:bg-gray-100"
          >
            <TextIcon className="w-4 h-4 text-gray-500 mr-2" />
            <span>Text</span>
          </button>
        </div>
        <Stage
          ref={stageRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseDown={handleCanvasClick}
          onTouchEnd={handleCanvasClick}
        >
          <Layer>
            {selectedId !== null && (
              <Transformer ref={transformerRef} {...transformerOptions} />
            )}
            {shapes.map((shape) =>
              createElement(ShapeComponents[shape.component], {
                key: shape.id,
                id: shape.id,
                onDblClick: handleShapeDoubleClick,
                onDblTap: handleShapeDoubleClick,
                onClick: (e) => setSelectedId(e.target.id()),
                onTap: (e) => setSelectedId(e.target.id()),
                onTransform: handleShapeTransform,
                onTransformEnd: handleShapeTransformEnd,
                onDragEnd: handleShapeDragEnd,
                ...shape.options,
              })
            )}
          </Layer>
        </Stage>
      </div>
      <div className="w-56 shrink-none border-r">
        <div className="divide-y">
          {selectedShape && (
            <div>
              <h6 className="font-medium text-sm p-4 border-b">
                {selectedShape.name}
              </h6>
              <div className="grid grid-cols-2 gap-6 p-4">
                <div className="flex items-center">
                  <div className="text-xs text-gray-400 w-8">X</div>
                  <div className="text-xs">
                    {parseFloat(selectedShape.options.x).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-xs text-gray-400 w-8">Y</div>
                  <div className="text-xs">
                    {parseFloat(selectedShape.options.y).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-xs text-gray-400 w-8">W</div>
                  <div className="text-xs">
                    {selectedShape.options.width
                      ? parseFloat(selectedShape.options.width).toFixed(2)
                      : 'Auto'}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-xs text-gray-400 w-8">H</div>
                  <div className="text-xs">
                    {selectedShape.options.height
                      ? parseFloat(selectedShape.options.height).toFixed(2)
                      : 'Auto'}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-gray-400 w-8">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M20,19H4.09L14.18,4.43L15.82,5.57L11.28,12.13C12.89,12.96 14,14.62 14,16.54C14,16.7 14,16.85 13.97,17H20V19M7.91,17H11.96C12,16.85 12,16.7 12,16.54C12,15.28 11.24,14.22 10.14,13.78L7.91,17Z"
                      />
                    </svg>
                  </div>
                  <div className="text-xs">
                    {parseFloat(selectedShape.options.rotation).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
