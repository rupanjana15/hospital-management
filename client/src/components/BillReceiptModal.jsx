import React, { useRef } from "react";
import {
  X,
  Download,
  Printer,
  CheckCircle,
  Calendar,
  User,
  CreditCard,
  FileText,
} from "lucide-react";

const BillReceiptModal = ({ isOpen, onClose, bill }) => {
  const receiptRef = useRef(null);

  if (!isOpen || !bill) return null;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = () => {
    const windowPrint = window.open("", "", "width=800,height=600");

    windowPrint.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${bill.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 15mm;
              background: white;
              color: #333;
              font-size: 11px;
            }
            .receipt { 
              max-width: 750px; 
              margin: 0 auto; 
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 15px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .header-left { display: flex; align-items: center; gap: 12px; }
            .logo { font-size: 32px; }
            .company { text-align: left; }
            .company-name { font-size: 18px; font-weight: bold; }
            .tagline { font-size: 10px; opacity: 0.9; }
            .receipt-title { font-size: 14px; font-weight: 600; text-align: right; }
            
            .success-bar {
              background: #d1fae5;
              padding: 12px 20px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #10b981;
            }
            .success-left { display: flex; align-items: center; gap: 12px; }
            .check-icon {
              width: 36px; height: 36px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 20px;
              font-weight: bold;
            }
            .success-text h3 { font-size: 14px; color: #065f46; margin-bottom: 2px; }
            .success-text p { font-size: 10px; color: #047857; }
            .amount { font-size: 22px; font-weight: bold; color: #10b981; }
            
            .content { padding: 15px 20px; }
            .row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 10px; }
            .row-3 { grid-template-columns: repeat(3, 1fr); }
            .row-2 { grid-template-columns: 1fr 1fr; }
            
            .section {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 10px;
              margin-bottom: 10px;
            }
            .section-title {
              font-size: 9px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
              padding-bottom: 4px;
              border-bottom: 1px solid #e5e7eb;
            }
            .field { margin-bottom: 6px; }
            .field:last-child { margin-bottom: 0; }
            .label {
              font-size: 8px;
              color: #9ca3af;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              display: block;
              margin-bottom: 2px;
            }
            .value {
              font-size: 10px;
              color: #1f2937;
              font-weight: 500;
            }
            
            .breakdown { padding: 10px; background: #f9fafb; border-radius: 6px; }
            .breakdown-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              font-size: 10px;
            }
            .breakdown-label { color: #6b7280; }
            .breakdown-value { color: #1f2937; font-weight: 500; }
            .total {
              background: #f0fdf4;
              padding: 10px;
              border-radius: 6px;
              margin-top: 8px;
              display: flex;
              justify-content: space-between;
              border: 1px solid #10b981;
            }
            .total-label { font-size: 12px; font-weight: 600; color: #065f46; }
            .total-value { font-size: 16px; font-weight: bold; color: #10b981; }
            
            .note {
              background: #eff6ff;
              border: 1px solid #3b82f6;
              border-radius: 6px;
              padding: 8px;
              text-align: center;
              font-size: 8px;
              color: #1e40af;
              margin-top: 10px;
            }
            .footer {
              background: #f9fafb;
              padding: 8px 20px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
              font-size: 8px;
              color: #6b7280;
            }
            @media print {
              body { padding: 0; }
              .receipt { border: none; }
              @page { size: A4; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="header-left">
                <div class="logo">🏥</div>
                <div class="company">
                  <div class="company-name">Hospital Management</div>
                  <div class="tagline">Healthcare Services</div>
                </div>
              </div>
              <div class="receipt-title">PAYMENT RECEIPT</div>
            </div>

            <div class="success-bar">
              <div class="success-left">
                <div class="check-icon">✓</div>
                <div class="success-text">
                  <h3>Payment Successful</h3>
                  <p>Transaction completed successfully</p>
                </div>
              </div>
              <div class="amount">${formatAmount(bill.amount)}</div>
            </div>

            <div class="content">
              <div class="row">
                <div class="field">
                  <span class="label">Bill ID</span>
                  <span class="value">${bill.id}</span>
                </div>
                <div class="field">
                  <span class="label">Bill Date</span>
                  <span class="value">${formatDate(bill.createdAt)}</span>
                </div>
                <div class="field">
                  <span class="label">Payment Date</span>
                  <span class="value">${
                    bill.paidAt ? formatDate(bill.paidAt) : "N/A"
                  }</span>
                </div>
                <div class="field">
                  <span class="label">Payment Time</span>
                  <span class="value">${
                    bill.paidAt ? formatTime(bill.paidAt) : "N/A"
                  }</span>
                </div>
              </div>

              <div class="row-2 row">
                <div class="section">
                  <div class="section-title">Patient Details</div>
                  <div class="field">
                    <span class="label">Name</span>
                    <span class="value">${bill.patient?.name || "N/A"}</span>
                  </div>
                  <div class="field">
                    <span class="label">Phone</span>
                    <span class="value">${bill.patient?.phone || "N/A"}</span>
                  </div>
                </div>

                <div class="section">
                  <div class="section-title">Doctor Details</div>
                  <div class="field">
                    <span class="label">Name</span>
                    <span class="value">${bill.doctor?.name || "N/A"}</span>
                  </div>
                  <div class="field">
                    <span class="label">Specialization</span>
                    <span class="value">${
                      bill.doctor?.specialization || "N/A"
                    }</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Appointment & Payment Details</div>
                <div class="row-3 row" style="margin-bottom: 0;">
                  <div class="field">
                    <span class="label">Appointment ID</span>
                    <span class="value">${bill.appointmentId || "N/A"}</span>
                  </div>
                  <div class="field">
                    <span class="label">Appointment Date</span>
                    <span class="value">${
                      bill.appointment?.date
                        ? formatDate(bill.appointment.date)
                        : "N/A"
                    }</span>
                  </div>
                  <div class="field">
                    <span class="label">Time Slot</span>
                    <span class="value">${
                      bill.appointment?.startTime && bill.appointment?.endTime
                        ? `${bill.appointment.startTime} - ${bill.appointment.endTime}`
                        : "N/A"
                    }</span>
                  </div>
                  <div class="field">
                    <span class="label">Status</span>
                    <span class="value">${
                      bill.appointment?.status || "N/A"
                    }</span>
                  </div>
                  <div class="field">
                    <span class="label">Payment Method</span>
                    <span class="value">${
                      bill.paymentMethod?.replace("_", " ") || "N/A"
                    }</span>
                  </div>
                  <div class="field">
                    <span class="label">Transaction ID</span>
                    <span class="value">${bill.transactionRef || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div class="breakdown">
                <div class="breakdown-row">
                  <span class="breakdown-label">Consultation Fee</span>
                  <span class="breakdown-value">${formatAmount(
                    bill.amount * 0.8
                  )}</span>
                </div>
                <div class="breakdown-row">
                  <span class="breakdown-label">Service Charge</span>
                  <span class="breakdown-value">${formatAmount(
                    bill.amount * 0.1
                  )}</span>
                </div>
                <div class="breakdown-row">
                  <span class="breakdown-label">Tax (GST 18%)</span>
                  <span class="breakdown-value">${formatAmount(
                    bill.amount * 0.1
                  )}</span>
                </div>
                <div class="total">
                  <span class="total-label">Total Amount Paid</span>
                  <span class="total-value">${formatAmount(bill.amount)}</span>
                </div>
              </div>

              <div class="note">
                This is a computer-generated receipt. No signature required. For queries, contact support.
              </div>
            </div>

            <div class="footer">
              © ${new Date().getFullYear()} Hospital Management System • Generated: ${formatDate(
      new Date()
    )} ${formatTime(new Date())}
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    windowPrint.document.close();
  };

  const handlePrint = () => {
    handleDownload();
  };

  const consultationFee = bill.amount * 0.8;
  const serviceCharge = bill.amount * 0.1;
  const tax = bill.amount * 0.1;

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in no-print">
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 no-print">
            <h2 className="text-xl font-bold text-gray-100 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-green-400" />
              Payment Receipt
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Success Badge */}
            <div className="flex items-center justify-center">
              <div className="bg-green-500/10 border border-green-500/20 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-100 mb-2">
                Payment Successful
              </h3>
              <p className="text-sm text-gray-400">
                Thank you for your payment. Your transaction was successful.
              </p>
            </div>

            {/* Amount Paid */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">Amount Paid</p>
              <p className="text-3xl font-bold text-green-400">
                {formatAmount(bill.amount)}
              </p>
            </div>

            {/* Bill Details */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Bill Details
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bill ID</p>
                  <p className="text-sm font-medium text-gray-200">{bill.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bill Date</p>
                  <p className="text-sm font-medium text-gray-200">
                    {formatDate(bill.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Date</p>
                  <p className="text-sm font-medium text-gray-200">
                    {bill.paidAt ? formatDate(bill.paidAt) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Payment Time</p>
                  <p className="text-sm font-medium text-gray-200">
                    {bill.paidAt ? formatTime(bill.paidAt) : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Patient & Doctor Info */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Patient Info */}
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Patient Details
                  </h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-200">
                      {bill.patient?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-200">
                      {bill.patient?.phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Doctor Info */}
              <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="w-4 h-4 text-green-400" />
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Doctor Details
                  </h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium text-gray-200">
                      {bill.doctor?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Specialization</p>
                    <p className="text-sm font-medium text-gray-200">
                      {bill.doctor?.specialization || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Appointment Details
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Appointment ID</p>
                  <p className="text-sm font-medium text-gray-200">
                    {bill.appointmentId || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Appointment Date</p>
                  <p className="text-sm font-medium text-gray-200">
                    {bill.appointment?.date
                      ? formatDate(bill.appointment.date)
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="text-sm font-medium text-gray-200">
                    {bill.appointment?.startTime && bill.appointment?.endTime
                      ? `${bill.appointment.startTime} - ${bill.appointment.endTime}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm font-medium text-gray-200">
                    {bill.appointment?.status || "N/A"}
                  </p>
                </div>
              </div>
              {bill.appointment?.reason && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500">Reason</p>
                  <p className="text-sm font-medium text-gray-200">
                    {bill.appointment.reason}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Details */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <CreditCard className="w-4 h-4 text-gold-400" />
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Payment Details
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <p className="text-sm font-medium text-gray-200">
                    {bill.paymentMethod?.replace("_", " ") || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Transaction ID</p>
                  <p className="text-sm font-medium text-gray-200 break-all">
                    {bill.transactionRef || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Breakdown */}
            <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                Amount Breakdown
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Consultation Fee</span>
                  <span className="text-gray-200">
                    {formatAmount(consultationFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Service Charge</span>
                  <span className="text-gray-200">
                    {formatAmount(serviceCharge)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tax (GST)</span>
                  <span className="text-gray-200">{formatAmount(tax)}</span>
                </div>
                <div className="border-t border-gray-700/50 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-100">Total Amount</span>
                    <span className="text-green-400">
                      {formatAmount(bill.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-400 text-center">
                This is a computer-generated receipt and does not require a
                signature. For any queries, please contact our support team.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700 no-print">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-gray-900 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default BillReceiptModal;
