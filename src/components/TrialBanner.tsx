import { useEffect, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TrialBanner() {
    const { currentCompany } = useCompany();
    const navigate = useNavigate();
    const [trialInfo, setTrialInfo] = useState<{
        daysRemaining: number;
        isTrialActive: boolean;
    } | null>(null);

    useEffect(() => {
        console.log('🔍 TrialBanner - currentCompany:', currentCompany);

        if (!currentCompany) return;

        console.log('📊 subscription_status:', currentCompany.subscription_status);
        console.log('📅 trial_ends_at:', currentCompany.trial_ends_at);

        // Calculate days remaining
        if (currentCompany.subscription_status === 'trial' && currentCompany.trial_ends_at) {
            const now = new Date();
            const endsAt = new Date(currentCompany.trial_ends_at);
            const diffTime = endsAt.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            console.log('⏰ Days remaining:', diffDays);

            setTrialInfo({
                daysRemaining: Math.max(0, diffDays),
                isTrialActive: diffDays > 0,
            });
        } else {
            console.log('❌ Not in trial or missing trial_ends_at');
        }
    }, [currentCompany]);

    if (!currentCompany) return null;
    if (currentCompany.subscription_status !== 'trial') return null;
    if (!trialInfo) return null;

    const { daysRemaining, isTrialActive } = trialInfo;

    if (!isTrialActive) {
        return (
            <Alert className="rounded-none border-x-0 border-t-0 border-red-500 bg-red-50">
                <Clock className="h-4 w-4 text-red-600" />
                <AlertDescription className="flex items-center justify-between">
                    <span className="text-red-900 font-medium">
                        Seu período de teste expirou. Contrate um plano para continuar usando a plataforma.
                    </span>
                    <Button
                        size="sm"
                        onClick={() => navigate('/pricing')}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Ver Planos
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    const variant = daysRemaining <= 1 ? 'destructive' : 'default';
    const bgColor = daysRemaining <= 1 ? 'bg-orange-50' : 'bg-blue-50';
    const textColor = daysRemaining <= 1 ? 'text-orange-900' : 'text-blue-900';

    return (
        <Alert className={`rounded-none border-x-0 border-t-0 ${bgColor}`} variant={variant}>
            <Clock className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
                <span className={`${textColor} font-medium`}>
                    {daysRemaining === 0
                        ? 'Último dia do seu período de teste! '
                        : `Você tem ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} restantes de teste gratuito. `
                    }
                    Aproveite para explorar todos os recursos!
                </span>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/pricing')}
                >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Contratar Plano
                </Button>
            </AlertDescription>
        </Alert>
    );
}
