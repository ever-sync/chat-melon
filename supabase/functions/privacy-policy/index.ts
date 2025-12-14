import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const policyHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Política de Privacidade - Clara</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; color: #333; }
        h1 { color: #4f46e5; }
        h2 { margin-top: 2rem; }
    </style>
</head>
<body>
    <h1>Política de Privacidade</h1>
    <p>Última atualização: 2025</p>
    <p>A sua privacidade é importante para nós. É política do Clara respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no site Clara, e outros sites que possuímos e operamos.</p>
    
    <h2>1. Informações que coletamos</h2>
    <p>Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento. Também informamos por que estamos coletando e como será usado.</p>
    
    <h2>2. Como usamos suas informações</h2>
    <p>Apenas retemos as informações coletadas pelo tempo necessário para fornecer o serviço solicitado. Quando armazenamos dados, protegemos dentro de meios comercialmente aceitáveis ​​para evitar perdas e roubos, bem como acesso, divulgação, cópia, uso ou modificação não autorizados.</p>
    
    <h2>3. Compartilhamento de dados</h2>
    <p>Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei.</p>
    
    <p>O nosso site pode ter links para sites externos que não são operados por nós. Esteja ciente de que não temos controle sobre o conteúdo e práticas desses sites e não podemos aceitar responsabilidade por suas respectivas políticas de privacidade.</p>
</body>
</html>
`;

serve(async (req) => {
    return new Response(policyHtml, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
});
