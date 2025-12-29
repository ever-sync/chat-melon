-- Adicionar campo de redes sociais à tabela companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Comentário explicativo
COMMENT ON COLUMN companies.social_links IS 'Links das redes sociais da empresa: facebook, instagram, linkedin, youtube, twitter, whatsapp, tiktok, website';

-- Exemplo de estrutura do JSON:
-- {
--   "facebook": "https://facebook.com/empresa",
--   "instagram": "https://instagram.com/empresa",
--   "linkedin": "https://linkedin.com/company/empresa",
--   "youtube": "https://youtube.com/c/empresa",
--   "twitter": "https://twitter.com/empresa",
--   "whatsapp": "5511999999999",
--   "tiktok": "https://tiktok.com/@empresa",
--   "website": "https://empresa.com.br"
-- }
