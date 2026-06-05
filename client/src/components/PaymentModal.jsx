import React, { useState } from "react";
import {
  X,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const PaymentModal = ({ isOpen, onClose, bill, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [transactionId, setTransactionId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !bill) return null;

  const paymentMethods = [
    { id: "CREDIT_CARD", label: "Credit Card", icon: CreditCard },
    { id: "DEBIT_CARD", label: "Debit Card", icon: CreditCard },
    { id: "UPI", label: "UPI", icon: Smartphone },
    { id: "NET_BANKING", label: "Net Banking", icon: Building },
  ];

  const handlePayment = async () => {
    if (!transactionId.trim()) {
      setError("Please enter transaction ID");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      await onPaymentSuccess(bill.id, {
        paymentMethod,
        transactionId: transactionId.trim(),
      });

      // Reset form
      setTransactionId("");
      setPaymentMethod("CREDIT_CARD");
      onClose();
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-100 flex items-center">
            <CreditCard className="w-6 h-6 mr-2 text-gold-400" />
            Pay Bill
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Bill Details */}
          <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-700/50">
              <div>
                <p className="text-sm text-gray-400">Bill ID</p>
                <p className="text-sm font-medium text-gray-200">{bill.id}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Date</p>
                <p className="text-sm font-medium text-gray-200">
                  {formatDate(bill.createdAt)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400">Doctor</p>
              <p className="text-base font-semibold text-gray-100">
                {bill.doctorName}
              </p>
              <p className="text-xs text-gray-500">
                {bill.doctorSpecialization}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400">Appointment Date</p>
              <p className="text-sm font-medium text-gray-200">
                {formatDate(bill.appointmentDate)}
              </p>
            </div>

            {/* Amount Breakdown */}
            <div className="pt-3 border-t border-gray-700/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Consultation Fee</span>
                <span className="text-gray-200">
                  {formatAmount(bill.amount * 0.8)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Service Charge</span>
                <span className="text-gray-200">
                  {formatAmount(bill.amount * 0.1)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax (GST)</span>
                <span className="text-gray-200">
                  {formatAmount(bill.amount * 0.1)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-700/50">
                <span className="text-gray-100">Total Amount</span>
                <span className="text-gold-400">
                  {formatAmount(bill.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    disabled={isProcessing}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-lg border transition-all ${
                      paymentMethod === method.id
                        ? "bg-gold-500/20 border-gold-500/50 text-gold-400"
                        : "bg-gray-900/50 border-gray-700 text-gray-400 hover:bg-gray-700/30"
                    } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transaction ID Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transaction ID *
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              disabled={isProcessing}
              placeholder="Enter transaction reference number"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the transaction reference from your payment gateway
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Payment Info */}
          <div className="flex items-start space-x-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-400">
              <p className="font-medium mb-1">Secure Payment</p>
              <p className="text-xs text-blue-300/80">
                Your payment information is encrypted and secure. Please
                complete the payment through your chosen method and enter the
                transaction ID here.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-gray-900 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isProcessing || !transactionId.trim()}
            className="px-5 py-2.5 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Confirm & Pay {formatAmount(bill.amount)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
