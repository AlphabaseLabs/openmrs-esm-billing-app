import React, { useState, useMemo, useCallback } from 'react';
import { TreeView, TreeNode, type TreeNodeProps } from '@carbon/react';
import styles from './schema-viewer.scss';

interface SchemaViewerProps {
  data: string;
}

interface TreeNode {
  id: string;
  label: string;
  children?: Array<TreeNode>;
}

const transformDataToTree = (data: Record<string, any>, parentKey = 'root'): Array<TreeNode> => {
  return Object.entries(data).map(([key, value]) => {
    const nodeId = `${parentKey}-${key}`;
    const isObject = typeof value === 'object' && !Array.isArray(value);

    return {
      id: nodeId,
      label: isObject || Array.isArray(value) ? key : `${key}: ${value}`,
      children: Array.isArray(value)
        ? value.map((item, index) => ({
            id: `${nodeId}-${index}`,
            label: `${item.description} (${item.concept})`,
          }))
        : isObject
          ? transformDataToTree(value, nodeId)
          : undefined,
    };
  });
};

const SchemaViewer: React.FC<SchemaViewerProps> = ({ data }) => {
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const treeData = useMemo(() => {
    try {
      return transformDataToTree(JSON.parse(data));
    } catch {
      return [];
    }
  }, [data]);

  const handleSelect = useCallback(
    (
      event: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>,
      selectedNode: Pick<TreeNodeProps, 'value' | 'id' | 'label'> & { activeNodeId?: string | number },
    ) => {
      // Extract the node ID from the selected node object
      const nodeId = selectedNode.id || selectedNode.value?.toString() || selectedNode.activeNodeId?.toString();
      if (nodeId) {
        setSelectedNodes((prev) => {
          // For multiselect, toggle the node in the array
          if (prev.includes(nodeId)) {
            return prev.filter((id) => id !== nodeId);
          }
          return [...prev, nodeId];
        });
      }
    },
    [],
  );

  const handleToggle = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const renderTreeNodes = (nodes: Array<TreeNode>) =>
    nodes.map((node) => {
      const isExpanded = expandedNodes.has(node.id);
      return (
        <TreeNode
          key={node.id}
          id={node.id}
          label={node.label}
          isExpanded={isExpanded}
          onToggle={() => handleToggle(node.id)}
          className={styles.treeView}>
          {node.children && renderTreeNodes(node.children)}
        </TreeNode>
      );
    });

  return (
    <div className={styles.treeViewContainer}>
      <TreeView
        label="Exemption schema"
        selected={selectedNodes}
        onSelect={(event, selectedNode) => handleSelect(event, selectedNode)}
        hideLabel
        multiselect>
        {renderTreeNodes(treeData)}
      </TreeView>
    </div>
  );
};

export default SchemaViewer;
