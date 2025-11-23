import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@/componentes/ui/button';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

export const ImagenRedimensionable = (props: NodeViewProps) => {
    const { node, updateAttributes } = props;
    const [isHovered, setIsHovered] = useState(false);
    const currentWidth = node.attrs.width || '300px';
    const getWidthValue = (w: string) => {
        if (typeof w === 'number') return w;
        return parseInt(w.replace(/[^0-9]/g, ''), 10);
    };

    const widthValue = getWidthValue(currentWidth);
    const isPercentage = currentWidth.toString().includes('%');

    const handleResize = (direction: 'increase' | 'decrease') => {
        const step = isPercentage ? 10 : 50;
        const min = isPercentage ? 10 : 50;
        const max = isPercentage ? 100 : 800;

        let newWidth = direction === 'increase' ? widthValue + step : widthValue - step;
        if (newWidth < min) newWidth = min;
        if (newWidth > max) newWidth = max;

        updateAttributes({
            width: isPercentage ? `${newWidth}%` : `${newWidth}px`,
        });
    };

    return (
        <NodeViewWrapper className="inline-block relative group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative inline-block">
                <img
                    src={node.attrs.src}
                    alt={node.attrs.alt}
                    style={{
                        width: currentWidth,
                        height: 'auto',
                        maxWidth: '100%',
                        borderRadius: '0.375rem',
                        border: isHovered ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                        transition: 'all 0.2s ease'
                    }}
                    className="block"
                    data-id={node.attrs['data-id']}
                    data-version-id={node.attrs['data-version-id']}
                />

                {isHovered && (
                    <div className="absolute top-2 right-2 flex gap-1 bg-black/50 rounded-md p-1 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
                            onClick={(e) => {
                                e.preventDefault();
                                handleResize('decrease');
                            }}
                            disabled={widthValue <= (isPercentage ? 10 : 50)}
                            title="Reducir tamaño"
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-px bg-white/20 mx-0.5" />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white hover:bg-white/20 hover:text-white"
                            onClick={(e) => {
                                e.preventDefault();
                                handleResize('increase');
                            }}
                            disabled={widthValue >= (isPercentage ? 100 : 800)}
                            title="Aumentar tamaño"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
};
