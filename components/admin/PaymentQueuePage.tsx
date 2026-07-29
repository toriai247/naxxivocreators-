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
        <div className="space-y-3 font-sans">
            {/* Header Control Box */}
            <div className="bg-yellow-400 border border-slate-900 p-3.5 text-slate-950 flex items-center justify-between shadow-sm">
                <div>
                    <h2 className="text-xs font-black text-slate-950 uppercase tracking-wider font-mono">MANUAL PAYMENT REVIEW QUEUE</h2>
                    <p className="text-[10px] text-slate-800 font-bold font-mono">Verify transaction screenshots, wallet addresses, and approve user top-up balance</p>
                </div>
                <div className="text-[10px] px-2.5 py-1 bg-slate-900 text-yellow-400 font-black border border-slate-900 font-mono">
                    PENDING REVIEWS: {payments.length}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12 text-slate-500 text-xs font-mono"><LoadingSpinner /></div>
            ) : payments.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 p-8 text-center text-xs text-slate-500 font-mono">
                    NO PENDING MANUAL PAYMENTS IN THE REVIEW QUEUE
                </div>
            ) : (
                <div className="border border-slate-200 bg-white overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-black uppercase text-[10px] tracking-wider font-mono">
                                <th className="p-3 border-r border-slate-200">User Details</th>
                                <th className="p-3 border-r border-slate-200">Product / Item</th>
                                <th className="p-3 border-r border-slate-200">Amount ($)</th>
                                <th className="p-3 border-r border-slate-200">TRX ID / Note</th>
                                <th className="p-3 border-r border-slate-200">Submitted Time</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {payments.map(payment => (
                                <tr key={payment.id} className="hover:bg-yellow-50/60 transition-none">
                                    <td className="p-3 border-r border-slate-200">
                                        <div className="font-bold text-slate-900">{payment.profiles?.name || 'Unknown User'}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">@{payment.profiles?.username || 'no-username'}</div>
                                    </td>
                                    <td className="p-3 border-r border-slate-200">
                                        <div className="font-bold text-slate-900">{payment.products?.name || 'Top-Up Package'}</div>
                                        <div className="text-[10px] text-yellow-700 uppercase font-mono font-bold">{payment.products?.product_type || 'DIGITAL'}</div>
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-black text-emerald-600 font-mono">
                                        ${Number(payment.amount).toFixed(2)}
                                    </td>
                                    <td className="p-3 border-r border-slate-200 font-mono text-[10px] text-slate-600">
                                        {payment.transaction_notes || (payment as any).trx_id || 'No transaction note provided'}
                                    </td>
                                    <td className="p-3 border-r border-slate-200 text-[10px] text-slate-500 font-mono">
                                        {new Date(payment.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => setSelectedPayment(payment)} 
                                            className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 border border-slate-900 text-[10px] font-black active:bg-yellow-500 transition-none font-mono"
                                        >
                                            [REVIEW TRX]
                                        </button>
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