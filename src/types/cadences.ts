// =====================================================
// Sales Cadences Types
// =====================================================

export type CadenceStatus = 'draft' | 'active' | 'paused' | 'archived';
export type CadenceStepChannel = 'whatsapp' | 'email' | 'task' | 'delay' | 'condition';
export type EnrollmentStatus = 'active' | 'completed' | 'replied' | 'converted' | 'paused' | 'exited' | 'bounced';

export interface CadenceStep {
    id: string;
    day: number;
    time?: string; // HH:mm format
    channel: CadenceStepChannel;

    // WhatsApp step
    template_id?: string;
    message_content?: string;

    // Email step
    subject?: string;
    email_content?: string;

    // Task step
    task_type?: 'call' | 'meeting' | 'follow_up' | 'other';
    task_title?: string;
    task_description?: string;

    // Delay step
    delay_days?: number;
    delay_hours?: number;

    // Condition step
    condition_type?: 'replied' | 'opened' | 'clicked' | 'not_replied';
    condition_goto_step?: number;
}

export interface CadenceSettings {
    businessHoursOnly?: boolean;
    timezone?: string;
    sendOnWeekends?: boolean;
    maxAttempts?: number;
    stopOnReply?: boolean;
    stopOnConversion?: boolean;
}

export interface Cadence {
    id: string;
    company_id: string;
    name: string;
    description?: string;
    steps: CadenceStep[];
    settings: CadenceSettings;
    status: CadenceStatus;
    total_enrolled: number;
    total_completed: number;
    total_replied: number;
    total_converted: number;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface CadenceStepHistory {
    step: number;
    executed_at: string;
    status: 'sent' | 'delivered' | 'failed' | 'skipped';
    error_message?: string;
}

export interface CadenceEnrollment {
    id: string;
    cadence_id: string;
    contact_id: string;
    deal_id?: string;
    current_step: number;
    status: EnrollmentStatus;
    next_step_at?: string;
    completed_at?: string;
    replied_at?: string;
    converted_at?: string;
    exit_reason?: string;
    step_history: CadenceStepHistory[];
    enrolled_by?: string;
    created_at: string;
    updated_at: string;

    // Joined fields
    contact?: {
        name: string;
        phone_number: string;
    };
    cadence?: {
        name: string;
    };
}

export interface CreateCadenceInput {
    name: string;
    description?: string;
    steps?: CadenceStep[];
    settings?: CadenceSettings;
}

export interface UpdateCadenceInput {
    name?: string;
    description?: string;
    steps?: CadenceStep[];
    settings?: CadenceSettings;
    status?: CadenceStatus;
}

export interface EnrollContactInput {
    cadence_id: string;
    contact_id: string;
    deal_id?: string;
}
