import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const ConditionNode = memo(({ data }: NodeProps) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-yellow-600 !w-3 !h-3 !border-2 !border-white"
      />
      <div
        className="px-4 py-3 bg-yellow-500 text-white shadow-lg border-2 border-yellow-600 min-w-[140px] text-center"
        style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          width: '140px',
          height: '140px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>
          <div className="font-medium text-sm">{data.label}</div>
          {data.nodeType && <div className="text-xs opacity-90 mt-0.5">{data.nodeType}</div>}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        className="!bg-yellow-600 !w-3 !h-3 !border-2 !border-white !-bottom-1 !left-1/4"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        className="!bg-yellow-600 !w-3 !h-3 !border-2 !border-white !-bottom-1 !right-1/4"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
