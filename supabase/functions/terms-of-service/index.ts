import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const termsHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Termos de Serviço - Clara</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; color: #333; }
        h1 { color: #4f46e5; }
        h2 { margin-top: 2rem; }
    </style>
</head>
<body>
    <h1>Termos de Serviço</h1>
    <p>Última atualização: 2025</p>
    
    <h2>1. Termos</h2>
    <p>Ao acessar ao site Clara, concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.</p>
    
    <h2>2. Uso de Licença</h2>
    <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site Clara , apenas para visualização transitória pessoal e não comercial.</p>
    
    <h2>3. Isenção de responsabilidade</h2>
    <p>Os materiais no site da Clara são fornecidos 'como estão'. Clara não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias.</p>
    
    <h2>4. Modificações</h2>
    <p>O Clara pode revisar estes termos de serviço do site a qualquer momento, sem aviso prévio. Ao usar este site, você concorda em ficar vinculado à versão atual desses termos de serviço.</p>
    
    <h2>5. Lei aplicável</h2>
    <p>Estes termos e condições são regidos e interpretados de acordo com as leis do Clara e você se submete irrevogavelmente à jurisdição exclusiva dos tribunais naquele estado ou localidade.</p>
</body>
</html>
`;

serve(async (req) => {
    return new Response(termsHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
});
