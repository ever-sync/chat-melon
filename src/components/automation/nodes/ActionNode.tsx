import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";

export const ActionNode = memo(({ data }: NodeProps) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-600 !w-3 !h-3 !border-2 !border-white"
      />
      <div className="px-4 py-3 rounded-lg bg-blue-500 text-white shadow-lg border-2 border-blue-600 min-w-[140px]">
        <div className="font-medium text-sm">{data.label}</div>
        {data.nodeType && (
          <div className="text-xs opacity-90 mt-0.5">{data.nodeType}</div>
        )}
        {data.config?.message && (
          <div className="text-xs opacity-75 mt-1 line-clamp-2">
            {data.config.message}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-600 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
});

ActionNode.displayName = "ActionNode";
