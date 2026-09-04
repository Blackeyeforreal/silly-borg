'use client';

import React from 'react';
import { EditableField } from './EditableField';
import { Plus, X } from 'lucide-react';

interface EditableListProps {
  items: string[];
  basePath: string;
  onUpdate: (index: number, value: string) => void;
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  label?: string;
  className?: string;
  itemClassName?: string;
}

export function EditableList({
  items,
  basePath,
  onUpdate,
  onAdd,
  onRemove,
  label,
  className = '',
  itemClassName = ''
}: EditableListProps) {
  return (
    <div className={`group/list ${className}`}>
      {label && <span className="font-bold mr-1">{label}</span>}
      <ul className="list-disc ml-5 space-y-1">
        {items.map((item, index) => (
          <li key={index} className={`relative group pl-1 ${itemClassName}`}>
            <EditableField
              value={item}
              onSave={(val) => onUpdate(index, val)}
              fieldPath={`${basePath}[${index}]`}
              multiline
              as="div"
            />
            <button
              onClick={() => onRemove(index)}
              className="absolute -right-6 top-1 p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded transition-opacity no-print"
              title="Remove item"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => onAdd('New item')}
        className="mt-1 ml-5 flex items-center text-xs text-blue-600 hover:text-blue-800 opacity-60 hover:opacity-100 transition-opacity no-print py-0.5"
      >
        <Plus className="w-3 h-3 mr-1" /> Add item
      </button>
    </div>
  );
}
