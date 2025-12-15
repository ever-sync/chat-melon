import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import type {
    Order,
    OrderStatusChange,
    CreateOrderInput,
    UpdateOrderInput,
    OrderStatus,
} from '@/types/orders';

// =====================================================
// Orders CRUD Hook
// =====================================================

export function useOrders(filters?: {
    status?: OrderStatus;
    contactId?: string;
    limit?: number;
}) {
    const { currentCompany } = useCompany();
    const queryClient = useQueryClient();

    const ordersQuery = useQuery({
        queryKey: ['orders', currentCompany?.id, filters],
        queryFn: async () => {
            if (!currentCompany?.id) return [];

            let query = supabase
                .from('orders')
                .select(`
          *,
          contact:contacts(name, phone_number)
        `)
                .eq('company_id', currentCompany.id)
                .order('created_at', { ascending: false });

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }

            if (filters?.contactId) {
                query = query.eq('contact_id', filters.contactId);
            }

            if (filters?.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as Order[];
        },
        enabled: !!currentCompany?.id,
    });

    const createOrder = useMutation({
        mutationFn: async (input: CreateOrderInput) => {
            if (!currentCompany?.id) throw new Error('Company not found');

            const { data: { user } } = await supabase.auth.getUser();

            // Calculate totals
            const subtotal = input.items.reduce((sum, item) => sum + item.total, 0);
            const discountAmount = input.discount_type === 'percentage'
                ? subtotal * ((input.discount || 0) / 100)
                : (input.discount || 0);
            const total = subtotal - discountAmount + (input.shipping || 0) + (input.tax || 0);

            const { data, error } = await supabase
                .from('orders')
                .insert({
                    company_id: currentCompany.id,
                    contact_id: input.contact_id,
                    conversation_id: input.conversation_id,
                    deal_id: input.deal_id,
                    items: input.items,
                    subtotal,
                    discount: input.discount || 0,
                    discount_type: input.discount_type || 'fixed',
                    shipping: input.shipping || 0,
                    tax: input.tax || 0,
                    total,
                    payment_method: input.payment_method,
                    shipping_address: input.shipping_address,
                    customer_notes: input.customer_notes,
                    internal_notes: input.internal_notes,
                    created_by: user?.id,
                })
                .select(`
          *,
          contact:contacts(name, phone_number)
        `)
                .single();

            if (error) throw error;
            return data as Order;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });

    const updateOrder = useMutation({
        mutationFn: async ({ id, ...input }: UpdateOrderInput & { id: string }) => {
            const { data, error } = await supabase
                .from('orders')
                .update({
                    ...input,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select(`
          *,
          contact:contacts(name, phone_number)
        `)
                .single();

            if (error) throw error;
            return data as Order;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });

    const updateOrderStatus = useMutation({
        mutationFn: async ({ id, status, notes }: { id: string; status: OrderStatus; notes?: string }) => {
            const updates: Partial<Order> = {
                status,
                updated_at: new Date().toISOString(),
            };

            // Set timestamps based on status
            if (status === 'paid') {
                updates.paid_at = new Date().toISOString();
                updates.payment_status = 'paid';
            } else if (status === 'shipped') {
                updates.shipped_at = new Date().toISOString();
            } else if (status === 'delivered') {
                updates.delivered_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Order;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });

    const cancelOrder = useMutation({
        mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
            const { data, error } = await supabase
                .from('orders')
                .update({
                    status: 'cancelled',
                    internal_notes: reason,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data as Order;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });

    return {
        orders: ordersQuery.data || [],
        isLoading: ordersQuery.isLoading,
        error: ordersQuery.error,
        createOrder,
        updateOrder,
        updateOrderStatus,
        cancelOrder,
    };
}

// =====================================================
// Single Order Hook
// =====================================================

export function useOrder(id: string | undefined) {
    const queryClient = useQueryClient();

    const orderQuery = useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            if (!id) return null;

            const { data, error } = await supabase
                .from('orders')
                .select(`
          *,
          contact:contacts(name, phone_number, email)
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as Order;
        },
        enabled: !!id,
    });

    const statusHistoryQuery = useQuery({
        queryKey: ['order-history', id],
        queryFn: async () => {
            if (!id) return [];

            const { data, error } = await supabase
                .from('order_status_history')
                .select('*')
                .eq('order_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as OrderStatusChange[];
        },
        enabled: !!id,
    });

    return {
        order: orderQuery.data,
        statusHistory: statusHistoryQuery.data || [],
        isLoading: orderQuery.isLoading,
        error: orderQuery.error,
    };
}

// =====================================================
// Order Analytics Hook
// =====================================================

export function useOrderAnalytics(days = 30) {
    const { currentCompany } = useCompany();

    const analyticsQuery = useQuery({
        queryKey: ['order-analytics', currentCompany?.id, days],
        queryFn: async () => {
            if (!currentCompany?.id) return null;

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const { data: orders, error } = await supabase
                .from('orders')
                .select('status, payment_status, total, created_at')
                .eq('company_id', currentCompany.id)
                .gte('created_at', startDate.toISOString());

            if (error) throw error;

            // Calculate metrics
            const totalOrders = orders?.length || 0;
            const paidOrders = orders?.filter(o => o.payment_status === 'paid') || [];
            const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
            const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

            // Status breakdown
            const statusCounts = orders?.reduce((acc, o) => {
                acc[o.status] = (acc[o.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>) || {};

            // Daily breakdown
            const dailyData = orders?.reduce((acc, o) => {
                const date = new Date(o.created_at).toISOString().split('T')[0];
                if (!acc[date]) {
                    acc[date] = { orders: 0, revenue: 0 };
                }
                acc[date].orders++;
                if (o.payment_status === 'paid') {
                    acc[date].revenue += o.total || 0;
                }
                return acc;
            }, {} as Record<string, { orders: number; revenue: number }>) || {};

            return {
                totalOrders,
                paidOrders: paidOrders.length,
                totalRevenue,
                avgOrderValue,
                statusCounts,
                conversionRate: totalOrders > 0 ? (paidOrders.length / totalOrders) * 100 : 0,
                dailyData: Object.entries(dailyData)
                    .map(([date, data]) => ({ date, ...data }))
                    .sort((a, b) => a.date.localeCompare(b.date)),
            };
        },
        enabled: !!currentCompany?.id,
    });

    return {
        analytics: analyticsQuery.data,
        isLoading: analyticsQuery.isLoading,
        error: analyticsQuery.error,
    };
}

// =====================================================
// PIX Payment Hook
// =====================================================

export function usePixPayment() {
    const queryClient = useQueryClient();

    const generatePix = useMutation({
        mutationFn: async ({ orderId, amount }: { orderId: string; amount: number }) => {
            const { data, error } = await supabase.functions.invoke('create-pix-charge', {
                body: { orderId, amount },
            });

            if (error) throw error;

            // Update order with PIX data
            await supabase
                .from('orders')
                .update({
                    pix_code: data.pixCode,
                    pix_qrcode_url: data.qrCodeUrl,
                    pix_expiration: data.expiration,
                    status: 'awaiting_payment',
                    payment_status: 'pending',
                })
                .eq('id', orderId);

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });

    return {
        generatePix,
    };
}
