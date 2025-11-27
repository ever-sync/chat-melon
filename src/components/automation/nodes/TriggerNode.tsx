import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";

export const TriggerNode = memo(({ data }: NodeProps) => {
  return (
    <div className="relative">
      <div className="px-4 py-3 rounded-full bg-green-500 text-white shadow-lg border-2 border-green-600 min-w-[120px] text-center">
        <div className="font-medium text-sm">{data.label}</div>
        {data.nodeType && (
          <div className="text-xs opacity-90 mt-0.5">{data.nodeType}</div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-600 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
});

TriggerNode.displayName = "TriggerNode";
