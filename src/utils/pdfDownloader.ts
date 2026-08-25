import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Dispara o download de um Blob ou URL direto para o computador do usuário
 */
export function triggerBrowserDownload(blobOrUrl: Blob | string, filename: string): boolean {
  try {
    let blobUrl: string;
    let isCreatedUrl = false;

    if (blobOrUrl instanceof Blob) {
      blobUrl = window.URL.createObjectURL(blobOrUrl);
      isCreatedUrl = true;
    } else {
      blobUrl = blobOrUrl;
    }

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = filename;
    a.setAttribute('download', filename);
    a.target = '_blank';
    document.body.appendChild(a);

    // Dispara evento de clique
    if (typeof a.click === 'function') {
      a.click();
    } else {
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      a.dispatchEvent(clickEvent);
    }

    // Limpeza com delay seguro para o navegador registrar o download
    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        if (isCreatedUrl) {
          window.URL.revokeObjectURL(blobUrl);
        }
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    }, 3000);

    return true;
  } catch (err) {
    console.error('Erro ao disparar download no navegador:', err);
    return false;
  }
}

/**
 * Obtém a instância da fábrica html2pdf de forma resiliente a diferentes empacotadores (Vite, Rollup, Webpack)
 */
export const getHtml2PdfInstance = () => {
  if (typeof window !== 'undefined' && (window as any).html2pdf) {
    return (window as any).html2pdf;
  }
  if (typeof html2pdf === 'function') {
    return html2pdf;
  }
  if (html2pdf && typeof (html2pdf as any).default === 'function') {
    return (html2pdf as any).default;
  }
  return null;
};

export interface PDFDownloadOptions {
  margin?: number | number[];
  pagebreakMode?: string[];
  scale?: number;
}

/**
 * Gera e realiza o download do PDF do elemento DOM com garantia de fallback em múltiplas estratégias
 */
export async function downloadElementAsPDF(
  element: HTMLElement,
  filename: string,
  options?: PDFDownloadOptions
): Promise<{ success: boolean; error?: any }> {
  if (!element) {
    return { success: false, error: new Error('Elemento não encontrado') };
  }

  // Garante que todas as fontes web estejam completamente carregadas antes de capturar
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      // Ignora erro de suporte a fontes
    }
  }

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const margin = options?.margin ?? [0, 0, 0, 0];
  const scale = options?.scale ?? 2;

  // Função para padronizar o DOM clonado de forma idêntica em qualquer sistema operacional (Win 7, Win 10, Win 11, Mac)
  const normalizeClonedDoc = (clonedDoc: Document) => {
    try {
      const style = clonedDoc.createElement('style');
      style.innerHTML = `
        * {
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          text-rendering: geometricPrecision !important;
          box-sizing: border-box !important;
        }
        body, div, p, span, h1, h2, h3, h4, table, td, th, li, strong, em {
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
        }
      `;
      clonedDoc.head.appendChild(style);

      const clonedTarget = clonedDoc.querySelector(`[data-pdf-root]`) || clonedDoc.body.firstElementChild;
      if (clonedTarget instanceof HTMLElement) {
        clonedTarget.style.width = '794px';
        clonedTarget.style.maxWidth = '794px';
        clonedTarget.style.minWidth = '794px';
        clonedTarget.style.margin = '0 auto';
        clonedTarget.style.backgroundColor = '#ffffff';
        clonedTarget.style.color = '#000000';
      }
    } catch (e) {
      console.warn('Erro ao normalizar clone do documento:', e);
    }
  };

  const opt = {
    margin: margin,
    filename: cleanFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 1024, // Fixa a largura de renderização para anular diferenças de DPI e zoom do Windows 11
      backgroundColor: '#ffffff',
      onclone: (clonedDoc: Document) => {
        normalizeClonedDoc(clonedDoc);
      }
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: options?.pagebreakMode ?? ['css', 'legacy'] }
  };

  const pdfFactory = getHtml2PdfInstance();

  // ESTRATÉGIA 1: Gerar Blob via html2pdf e acionar download direto no navegador
  if (pdfFactory) {
    try {
      const worker = pdfFactory().set(opt).from(element);
      
      // Tenta obter o Blob gerado
      const blob = await worker.outputPdf('blob');
      if (blob && blob.size > 0) {
        const downloaded = triggerBrowserDownload(blob, cleanFilename);
        if (downloaded) {
          return { success: true };
        }
      }
    } catch (err1) {
      console.warn('Estratégia 1 (html2pdf blob) falhou, tentando Estratégia 2 (html2pdf save):', err1);
    }

    // ESTRATÉGIA 2: Chamar .save() direto do worker
    try {
      await pdfFactory().set(opt).from(element).save();
      return { success: true };
    } catch (err2) {
      console.warn('Estratégia 2 (html2pdf save) falhou, tentando Estratégia 3 (html2canvas + jsPDF):', err2);
    }
  }

  // ESTRATÉGIA 3: Fallback direto usando html2canvas + jsPDF puro
  try {
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 1024,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc: Document) => {
        normalizeClonedDoc(clonedDoc);
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 5) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const pdfBlob = pdf.output('blob');
    const ok = triggerBrowserDownload(pdfBlob, cleanFilename);
    if (ok) {
      return { success: true };
    }

    pdf.save(cleanFilename);
    return { success: true };
  } catch (err3) {
    console.error('Todas as estratégias de PDF falharam:', err3);
    // Último recurso: diálogo de impressão nativa
    window.print();
    return { success: false, error: err3 };
  }
}
