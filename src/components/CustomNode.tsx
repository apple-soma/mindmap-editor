import React, { memo, useCallback, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

interface CustomNodeProps extends NodeProps {
  data: {
    label: string;
  };
  isConnectable: boolean;
  selected: boolean;
}

const CustomNode = ({ data, isConnectable, selected, id }: CustomNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label);

  useEffect(() => {
    setText(data.label);
  }, [data.label]);

  const onTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setText(newText);
  }, []);

  const onBlur = useCallback(() => {
    setIsEditing(false);
    if (text !== data.label) {
      const customEvent = new CustomEvent('nodeTextChange', {
        detail: { id, text }
      });
      window.dispatchEvent(customEvent);
    }
  }, [id, text, data.label]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }, []);

  const onDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  return (
    <div
      style={{
        padding: '10px',
        borderRadius: '5px',
        backgroundColor: selected ? '#FFD700' : '#ffffff',
        border: '1px solid #ccc',
        minWidth: '150px',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isConnectable && <Handle type="target" position={Position.Top} />}
      {isEditing ? (
        <textarea
          value={text}
          onChange={onTextChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          autoFocus
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'transparent',
            fontSize: '14px',
            textAlign: 'center',
            outline: 'none',
            padding: '0',
            cursor: 'text',
            resize: 'none',
            overflow: 'hidden',
            fontFamily: 'inherit',
            lineHeight: '1.2',
          }}
        />
      ) : (
        <div
          onDoubleClick={onDoubleClick}
          style={{
            width: '100%',
            height: '100%',
            textAlign: 'center',
            fontSize: '14px',
            wordBreak: 'break-word',
            cursor: 'text',
            userSelect: 'text',
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </div>
      )}
      {isConnectable && <Handle type="source" position={Position.Bottom} />}
    </div>
  );
};

export default memo(CustomNode);