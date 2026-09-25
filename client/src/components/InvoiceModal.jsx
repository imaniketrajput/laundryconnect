import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Loader2, AlertCircle, X, Printer, Download } from 'lucide-react';

/**
 * InvoiceModal
 * Props:
 *   orderId  {string}   the order whose invoice to fetch
 *   onClose  {fn}       called when the modal should be dismissed
 */
const InvoiceModal = ({ orderId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/payments/${orderId}/invoice`);
        setInvoice(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load invoice. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [orderId]);

  // Close on overlay click (but not card click)
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setDownloadingPdf(true);
      const res = await api.get(`/payments/${orderId}/invoice/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.invoiceId || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
      alert('Failed to download invoice PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <>
      {/* ── Print-only styles injected once via <style> ─────────────── */}
      <style>{`
        @media print {
          body > *:not(#invoice-print-root) { display: none !important; }
          #invoice-print-root { display: block !important; position: static !important; }
          .no-print { display: none !important; }
          .invoice-card {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            padding: 0 !important;
            color: #000 !important;
            background: #fff !important;
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        id="invoice-print-root"
        ref={overlayRef}
        onClick={handleOverlayClick}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 py-6 overflow-y-auto"
      >
        {/* Card */}
        <div className="invoice-card relative bg-theme-card text-theme-primary rounded-3xl shadow-2xl w-full max-w-2xl border border-theme animate-in fade-in zoom-in-95 duration-150">

          {/* Close button */}
          <button
            onClick={onClose}
            className="no-print absolute top-4 right-4 p-1.5 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-elevated transition-colors"
            aria-label="Close invoice"
          >
            <X className="h-5 w-5" />
          </button>

          {/* ─── Loading ─────────────────────────────────────────────── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-theme-muted">
              <Loader2 className="h-10 w-10 animate-spin text-theme-accent mb-3" />
              <p className="text-sm font-semibold text-theme-primary">Fetching invoice…</p>
            </div>
          )}

          {/* ─── Error ───────────────────────────────────────────────── */}
          {!loading && error && (
            <div className="p-8 flex flex-col items-center text-center space-y-3">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <p className="text-sm font-bold text-theme-primary">Invoice Unavailable</p>
              <p className="text-xs text-theme-muted">{error}</p>
              <button
                onClick={onClose}
                className="no-print mt-2 px-5 py-2 bg-theme-accent text-[var(--accent-text)] rounded-xl text-xs font-bold theme-btn-hover"
              >
                Close
              </button>
            </div>
          )}

          {/* ─── Invoice Content ─────────────────────────────────────── */}
          {!loading && invoice && (
            <div className="p-4 sm:p-8 space-y-4 sm:space-y-6" id="invoice-content">

              {/* Company Header */}
              <div className="text-center border-b border-theme pb-6">
                <h1 className="text-2xl font-black text-theme-primary font-poppins tracking-tight">
                  Laundry<span className="text-theme-accent">Connect</span>
                </h1>
                <p className="text-xs text-theme-muted mt-1">Professional Fabric Care · Smart Pickup &amp; Delivery</p>
                <span className="inline-block mt-3 px-3 py-1 bg-theme-accent-light border border-theme-accent text-theme-accent text-[10px] font-extrabold uppercase tracking-widest rounded-full">
                  Tax Invoice
                </span>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Invoice ID</p>
                    <p className="font-mono font-bold text-theme-primary text-xs mt-0.5">{invoice.invoiceId || orderId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Date</p>
                    <p className="text-theme-primary text-xs mt-0.5">
                      {invoice.paidAt
                        ? new Date(invoice.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Payment Method</p>
                    <p className="text-theme-primary font-semibold text-xs mt-0.5 capitalize">{invoice.paymentMethod || '—'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <div>
                    <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Billed To</p>
                    <p className="font-bold text-theme-primary text-xs mt-0.5">{invoice.customerName || 'Customer'}</p>
                    <p className="text-theme-muted text-[11px]">{invoice.customerEmail || ''}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Status</p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded text-[10px] font-extrabold uppercase">
                      {invoice.paymentStatus || 'Paid'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-theme rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[340px] sm:min-w-full text-left text-xs">
                    <thead>
                      <tr className="bg-theme-elevated text-theme-muted font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Service</th>
                        <th className="py-3 px-4 text-center">Qty / Unit</th>
                        <th className="py-3 px-4 text-right">Rate</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme">
                      {(invoice.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-theme-elevated/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-theme-primary">{item.name || item.service}</td>
                          <td className="py-3 px-4 text-center text-theme-muted">
                            {item.quantity} {item.unit || 'pc'}
                          </td>
                          <td className="py-3 px-4 text-right text-theme-muted">₹{item.pricePerUnit}</td>
                          <td className="py-3 px-4 text-right font-bold text-theme-primary">
                            ₹{(item.quantity * item.pricePerUnit).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="divide-y divide-theme">
                      <tr className="bg-theme-elevated/40 text-theme-muted">
                        <td colSpan={3} className="py-2.5 px-4 font-semibold">Items Subtotal</td>
                        <td className="py-2.5 px-4 text-right font-bold text-theme-primary">
                          ₹{(invoice.itemsSubtotal ?? invoice.totalAmount).toFixed(2)}
                        </td>
                      </tr>
                      <tr className="bg-theme-elevated/40 text-theme-muted">
                        <td colSpan={3} className="py-2.5 px-4 font-semibold">
                          Delivery Charge{invoice.deliveryDistanceKm ? ` (${invoice.deliveryDistanceKm} km)` : ''}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-theme-primary">
                          {invoice.deliveryCharge ? `₹${invoice.deliveryCharge.toFixed(2)}` : 'FREE'}
                        </td>
                      </tr>
                      {invoice.isExpress && (
                        <tr className="bg-theme-elevated/40 text-theme-accent">
                          <td colSpan={3} className="py-2.5 px-4 font-semibold">⚡ Express Service Fee</td>
                          <td className="py-2.5 px-4 text-right font-bold">
                            +₹{(invoice.expressFee || 150).toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-theme-elevated border-t-2 border-theme text-theme-primary">
                        <td colSpan={3} className="py-3.5 px-4 font-bold text-sm tracking-wide">Total Amount Paid</td>
                        <td className="py-3.5 px-4 text-right font-black text-xl text-theme-accent">
                          ₹{invoice.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Footer note */}
              <p className="text-[10px] text-theme-muted text-center leading-relaxed">
                Thank you for choosing LaundryConnect. This is a system-generated invoice and does not require a signature.
              </p>

              {/* Actions Bar */}
              <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2.5 bg-theme-accent text-[var(--accent-text)] rounded-2xl text-xs font-bold shadow-theme-accent transition-colors theme-btn-hover disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>{downloadingPdf ? 'Downloading…' : 'Download PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2.5 bg-theme-elevated border border-theme text-theme-primary hover:bg-theme-surface rounded-2xl text-xs font-bold transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Invoice</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InvoiceModal;
