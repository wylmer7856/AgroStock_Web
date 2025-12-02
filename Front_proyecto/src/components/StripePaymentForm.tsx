import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { BiCreditCard, BiLock, BiCheckCircle, BiXCircle } from 'react-icons/bi';
import './StripePaymentForm.css';

const getStripeKey = () => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key || key === 'pk_test_tu_clave_publica_aqui' || key.includes('example')) {
    return null;
  }
  return key;
};

const stripePromise = getStripeKey() ? loadStripe(getStripeKey()!) : null;

interface StripePaymentFormProps {
  monto: number;
  id_pedido: number;
  client_secret?: string;
  payment_intent_id?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

const CheckoutForm: React.FC<StripePaymentFormProps> = ({
  monto,
  id_pedido,
  client_secret: clientSecretProp,
  payment_intent_id: paymentIntentIdProp,
  onSuccess,
  onError,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(clientSecretProp || null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(paymentIntentIdProp || null);

  useEffect(() => {
    if (clientSecretProp) {
      setClientSecret(clientSecretProp);
      setPaymentIntentId(paymentIntentIdProp || null);
      return;
    }

    const crearPaymentIntent = async () => {
      try {
        const response = await fetch('/api/pagos/stripe/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('agrostock_token')}`
          },
          body: JSON.stringify({
            id_pedido,
            monto
          })
        });

        if (!response.ok) {
          throw new Error('Error al crear sesión de pago');
        }

        const data = await response.json();
        if (data.success && data.data) {
          setClientSecret(data.data.client_secret);
          setPaymentIntentId(data.data.payment_intent_id);
        } else {
          throw new Error(data.error || 'Error al crear sesión de pago');
        }
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Error desconocido');
      }
    };

    crearPaymentIntent();
  }, [id_pedido, monto, clientSecretProp, paymentIntentIdProp, onError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      onError('Stripe no está listo. Por favor, espera un momento.');
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setIsProcessing(false);
      onError('No se pudo encontrar el elemento de tarjeta');
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {}
        }
      });

      if (error) {
        onError(error.message || 'Error al procesar el pago');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        try {
          const confirmResponse = await fetch('/api/pagos/stripe/confirmar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('agrostock_token')}`
            },
            body: JSON.stringify({
              payment_intent_id: paymentIntent.id,
              estado: 'succeeded',
              id_pedido: id_pedido
            })
          });

          if (!confirmResponse.ok) {
            throw new Error('Error al confirmar el pago');
          }

          toast.success('¡Pago procesado exitosamente!');
          onSuccess(paymentIntent.id);
        } catch (confirmError) {
          toast.warning('Pago procesado, pero hubo un error al confirmar. Contacta soporte.');
          onSuccess(paymentIntent.id);
        }
      } else {
        onError('El pago no fue completado correctamente');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error desconocido al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  };

  if (!clientSecret) {
    return (
      <div className="stripe-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando formulario de pago...</span>
        </div>
        <p className="mt-2 text-muted">Preparando formulario de pago seguro...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <div className="stripe-form-header">
        <BiCreditCard className="me-2" />
        <h5>Información de Tarjeta</h5>
      </div>

      <div className="stripe-card-element-container">
        <CardElement options={cardElementOptions} />
      </div>

      <div className="stripe-form-info">
        <small className="text-muted">
          <BiLock className="me-1" />
          Tus datos están protegidos y encriptados
        </small>
        <small className="text-muted mt-1 d-block">
          Monto a pagar: <strong>${monto.toLocaleString()}</strong>
        </small>
      </div>

      <div className="stripe-form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Procesando...
            </>
          ) : (
            <>
              <BiCheckCircle className="me-2" />
              Pagar ${monto.toLocaleString()}
            </>
          )}
        </button>
      </div>

      <div className="stripe-test-cards mt-3">
        <small className="text-muted">
          <strong>Tarjetas de prueba:</strong><br />
          Visa: 4242 4242 4242 4242<br />
          Mastercard: 5555 5555 5555 4444<br />
          CVV: cualquier 3 dígitos | Fecha: cualquier fecha futura
        </small>
      </div>
    </form>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  if (!stripePromise) {
    return (
      <div className="alert alert-warning">
        <strong>Stripe no configurado:</strong> Por favor configura VITE_STRIPE_PUBLISHABLE_KEY en tu archivo .env
        <br />
        <small>Obtén tu clave en: https://dashboard.stripe.com/test/apikeys</small>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0d6efd',
        colorBackground: '#ffffff',
        colorText: '#212529',
        colorDanger: '#dc3545',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  return (
    <div className="stripe-payment-wrapper">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm {...props} />
      </Elements>
    </div>
  );
};

export default StripePaymentForm;

