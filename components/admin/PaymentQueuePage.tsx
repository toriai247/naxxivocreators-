import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import type { Session } from '@supabase/auth-js';
import type { Tables, Json } from '../../integrations/supabase/types';
import LoadingSpinner from '../common/LoadingSpinner';
import PaymentReviewModal from './PaymentReviewModal';

export type PaymentWithDetails = Tables<'manual_payments'> & {
    profiles: Pick<Tables<'profiles'>, 'name' | 'username'> | null;
    products: Pick<Tables<'products'>, 'id' | 'name' | 'product_type' | 'price' | 'details'> | null;
};

const PaymentQueuePage: React.FC<{ session: Session }> = ({ session }) => {
    const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);

    const fetchPendingPayments = useCallback(async () => {
        setLoading(true);
        try {
            let { data, error } = await supabase.rpc('get_pending_payments_admin');

            if (error) {
                console.warn("RPC get_pending_payments_admin failed, falling back to direct table query:", error.message);
                const fallback = await supabase
                    .from('manual_payments')
                    .select('*, profiles:user_id(name, username), products:product_id(id, name, product_type, price, details)')
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });
                data = fallback.data as any;
                error = fallback.error;
            }

            if (error) throw error;
            
            // The data from RPC is already joined. We just cast it to our display type.
            setPayments(data as any || []);

        } catch (error: any) {
            console.error("Failed to fetch payments:", error.message || error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchPendingPayments();
    }, [fetchPendingPayments]);

    return (
        <div className="bg-[var(--theme-card-bg)] p-6 rounded-xl shadow-lg border border-[var(--theme-secondary)]">
            <h2 className="text-2xl font-bold text-[var(--theme-text)] mb-4">Payment Review Queue</h2>
            {loading ? (
                <div className="flex justify-center items-center py-10"><LoadingSpinner /></div>
            ) : payments.length === 0 ? (
                <p className="text-[var(--theme-text-secondary)]">No pending payments to review.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="admin-table">
                        <thead className="admin-thead">
                            <tr>
                                <th className="admin-th">User</th>
                                <th className="admin-th">Product</th>
                                <th className="admin-th">Amount</th>
                                <th className="admin-th">Date</th>
                                <th className="admin-th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="admin-tbody">
                            {payments.map(payment => (
                                <tr key={payment.id} className="admin-tr">
                                    <td className="admin-td text-[var(--theme-text)]">{payment.profiles?.name || 'N/A'}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)]">{payment.products?.name || 'N/A'}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)]">${payment.amount.toFixed(2)}</td>
                                    <td className="admin-td text-[var(--theme-text-secondary)]">{new Date(payment.created_at).toLocaleString()}</td>
                                    <td className="admin-td text-right">
                                        <button onClick={() => setSelectedPayment(payment)} className="btn-edit">Review</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {selectedPayment && (
                <PaymentReviewModal 
                    session={session}
                    payment={selectedPayment} 
                    onClose={() => setSelectedPayment(null)} 
                    onUpdate={() => {
                        fetchPendingPayments();
                        setSelectedPayment(null);
                    }}
                />
            )}
        </div>
    );
};

export default PaymentQueuePage;