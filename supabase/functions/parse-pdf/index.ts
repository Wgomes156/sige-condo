import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "Nenhum arquivo enviado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Simple and fast text extraction - only look for readable ASCII text
    const text = quickExtractText(bytes);
    
    // Parse transactions from text
    const transacoes = parseTransacoesFromText(text);

    return new Response(
      JSON.stringify({ text: text.substring(0, 2000), transacoes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao processar PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fast text extraction - just get readable characters
function quickExtractText(bytes: Uint8Array): string {
  const decoder = new TextDecoder("latin1");
  const content = decoder.decode(bytes);
  
  // Quick extraction: find text between parentheses (common in PDFs)
  const textParts: string[] = [];
  let i = 0;
  const maxIterations = 50000; // Limit iterations to prevent timeout
  let iterations = 0;
  
  while (i < content.length && iterations < maxIterations) {
    iterations++;
    const openParen = content.indexOf("(", i);
    if (openParen === -1) break;
    
    const closeParen = content.indexOf(")", openParen);
    if (closeParen === -1) break;
    
    if (closeParen - openParen < 200) {
      const text = content.substring(openParen + 1, closeParen);
      // Only keep if it has readable characters
      if (/[a-zA-Z0-9\/\-,.\s]{2,}/.test(text)) {
        textParts.push(text.replace(/\\/g, ""));
      }
    }
    i = closeParen + 1;
  }
  
  return textParts.join(" ").replace(/\s+/g, " ").trim();
}

interface TransacaoExtraida {
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data_vencimento: string;
}

function parseTransacoesFromText(text: string): TransacaoExtraida[] {
  const transacoes: TransacaoExtraida[] = [];
  
  // Simple pattern: look for date followed by text and numbers
  const datePattern = /(\d{2})\/(\d{2})(?:\/(\d{2,4}))?/g;
  const valuePattern = /(\d{1,3}(?:\.\d{3})*,\d{2})/g;
  
  // Split into potential lines
  const parts = text.split(/\s{2,}|\n/);
  
  let currentDate = "";
  let currentDesc = "";
  
  for (let i = 0; i < Math.min(parts.length, 500); i++) {
    const part = parts[i].trim();
    if (!part) continue;
    
    // Check for date
    const dateMatch = part.match(/^(\d{2})\/(\d{2})(?:\/(\d{2,4}))?$/);
    if (dateMatch) {
      const day = dateMatch[1];
      const month = dateMatch[2];
      const year = dateMatch[3] ? (dateMatch[3].length === 2 ? "20" + dateMatch[3] : dateMatch[3]) : new Date().getFullYear().toString();
      currentDate = `${year}-${month}-${day}`;
      currentDesc = "";
      continue;
    }
    
    // Check for value (Brazilian format)
    const valueMatch = part.match(/^-?(\d{1,3}(?:\.\d{3})*,\d{2})$/);
    if (valueMatch && currentDate) {
      const valorStr = valueMatch[1].replace(/\./g, "").replace(",", ".");
      const valor = parseFloat(valorStr);
      
      if (valor > 0 && currentDesc) {
        const isReceita = part.startsWith("-") === false && 
          /credito|deposito|recebido|ted|pix\s+rec/i.test(currentDesc);
        
        transacoes.push({
          tipo: isReceita ? "receita" : "despesa",
          descricao: currentDesc.substring(0, 200),
          valor: Math.abs(valor),
          data_vencimento: currentDate,
        });
        currentDesc = "";
      }
      continue;
    }
    
    // Accumulate description
    if (currentDate && part.length > 2) {
      currentDesc = currentDesc ? currentDesc + " " + part : part;
    }
  }
  
  return transacoes;
}
