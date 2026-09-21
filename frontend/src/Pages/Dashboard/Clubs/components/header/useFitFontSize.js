import { useLayoutEffect, useRef, useState } from "react";

// Faz um texto de uma linha só caber na largura da caixa: mede no tamanho atual, projeta p/ o tamanho
// máximo e reduz na proporção (a largura do texto é proporcional ao font-size). Não mexe no DOM direto;
// observa a caixa (tela mudou) e o próprio texto (a fonte terminou de carregar).
// Uso: boxRef no contêiner de largura, textRef no elemento com `display: inline-block`.
export function useFitFontSize(text, max, min) {
    const boxRef = useRef(null);
    const textRef = useRef(null);
    const [size, setSize] = useState(max);

    useLayoutEffect(() => {
        const box = boxRef.current;
        const el = textRef.current;
        if (!box || !el) return undefined;

        const fit = () => {
            const avail = box.clientWidth;
            const current = parseFloat(getComputedStyle(el).fontSize);
            const width = el.getBoundingClientRect().width;
            if (!avail || !width || !current) return;
            const widthAtMax = width * (max / current);
            setSize(Math.max(min, Math.min(max, Math.floor(max * (avail / widthAtMax)))));
        };

        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(box);
        ro.observe(el);
        return () => ro.disconnect();
    }, [text, max, min]);

    return { boxRef, textRef, size };
}
