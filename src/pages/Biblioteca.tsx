import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, HelpCircle, FileText } from 'lucide-react';

export default function Biblioteca() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Biblioteca</h1>
          <p className="text-gray-500 mt-2">
            Centralize seus conhecimentos, documentos e perguntas frequentes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recursos da Biblioteca</CardTitle>
            <CardDescription>
              Acesse e gerencie todo o conteúdo da sua base de conhecimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Knowledge Base */}
              <button
                onClick={() => navigate('/knowledge-base')}
                className="flex flex-col items-start gap-3 p-6 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="p-3 rounded-lg bg-blue-100">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Knowledge Base</h3>
                  <p className="text-sm text-gray-500">
                    Base de conhecimento organizada com artigos e guias
                  </p>
                </div>
              </button>

              {/* Documentos */}
              <button
                onClick={() => navigate('/documents')}
                className="flex flex-col items-start gap-3 p-6 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
              >
                <div className="p-3 rounded-lg bg-purple-100">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Documentos</h3>
                  <p className="text-sm text-gray-500">
                    Gerencie todos os seus documentos e arquivos
                  </p>
                </div>
              </button>

              {/* FAQ */}
              <button
                onClick={() => navigate('/faq')}
                className="flex flex-col items-start gap-3 p-6 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-left"
              >
                <div className="p-3 rounded-lg bg-green-100">
                  <HelpCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">FAQ</h3>
                  <p className="text-sm text-gray-500">
                    Perguntas frequentes e respostas rápidas
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
