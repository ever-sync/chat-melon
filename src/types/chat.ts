export type Conversation = {
    id: string;
    contact_id?: string;
    contact_name: string;
    contact_number: string;
    profile_pic_url?: string;
    last_message?: string;
    last_message_time?: string;
    unread_count: number;
    status?: string;
    sector_id?: string;
    assigned_to?: string;
    tags?: string[];
    opted_in?: boolean;
    is_online?: boolean;
    channel_type?: 'whatsapp' | 'instagram' | 'messenger' | 'telegram' | 'widget' | 'email';
};
