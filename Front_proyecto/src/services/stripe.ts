import apiService from './api';
import type { ApiResponse } from '../types';

export interface StripePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  id_pago: number;
  referencia_pago: string;
}

class StripeService {
  async crearPaymentIntent(
    id_pedido: number,
    monto: number
  ): Promise<ApiResponse<StripePaymentIntentResponse>> {
    try {
      const response = await apiService.post<StripePaymentIntentResponse>(
        '/pagos/stripe/create-intent',
        {
          id_pedido,
          monto
        }
      );
      return response;
    } catch (error) {
      console.error('Error creando Payment Intent de Stripe:', error);
      throw error;
    }
  }

  async confirmarPago(
    payment_intent_id: string,
    estado: 'succeeded' | 'failed' | 'canceled'
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await apiService.post<{ message: string }>(
        '/pagos/stripe/confirmar',
        {
          payment_intent_id,
          estado
        }
      );
      return response;
    } catch (error) {
      console.error('Error confirmando pago de Stripe:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
export default stripeService;

