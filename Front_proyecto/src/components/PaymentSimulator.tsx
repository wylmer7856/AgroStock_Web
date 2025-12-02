import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { 
  BiCreditCard, 
  BiWallet, 
  BiMobile, 
  BiBuilding, 
  BiCheckCircle, 
  BiXCircle,
  BiCopy,
  BiQrScan
} from 'react-icons/bi';
import './PaymentSimulator.css';

interface PaymentSimulatorProps {
  metodoPago: 'transferencia' | 'nequi' | 'daviplata' | 'pse';
  monto: number;
  id_pedido: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentSimulator: React.FC<PaymentSimulatorProps> = ({
  metodoPago,
  monto,
  id_pedido,
  onSuccess,
  onCancel
}) => {
  const [paso, setPaso] = useState<'info' | 'procesando' | 'completado'>('info');
  const [referencia, setReferencia] = useState<string>('');

  React.useEffect(() => {
    const ref = `${metodoPago.toUpperCase()}_${Date.now()}_${id_pedido}`;
    setReferencia(ref);
  }, [metodoPago, id_pedido]);

  const copiarReferencia = () => {
    navigator.clipboard.writeText(referencia);
    toast.success('Referencia copiada al portapapeles');
  };

  const simularPago = async () => {
    setPaso('procesando');
    await new Promise(resolve => setTimeout(resolve, 2500));
    setPaso('completado');
    toast.success('¡Pago simulado exitosamente!');
    setTimeout(() => {
      onSuccess();
    }, 1000);
  };

  const getMetodoInfo = () => {
    switch (metodoPago) {
      case 'transferencia':
        return {
          icon: <BiBuilding className="fs-1" />,
          titulo: 'Transferencia Bancaria',
          color: '#0d6efd',
          instrucciones: [
            'Realiza una transferencia bancaria por el monto exacto',
            'Usa la referencia de pago que se muestra abajo',
            'El pago será verificado automáticamente',
            'Este es un simulador - no se realizará ningún cargo real'
          ],
          datos: {
            banco: 'Banco de Prueba',
            tipoCuenta: 'Ahorros',
            numeroCuenta: '1234-5678-9012-3456',
            titular: 'AgroStock S.A.S.',
            nit: '900.123.456-7'
          }
        };
      case 'nequi':
        return {
          icon: <BiMobile className="fs-1" />,
          titulo: 'Pago con Nequi',
          color: '#D62631',
          instrucciones: [
            'Abre tu app de Nequi',
            'Selecciona "Enviar" o "Pagar"',
            'Ingresa el número de celular: 300 123 4567',
            'Ingresa el monto exacto',
            'Confirma el pago',
            'Este es un simulador - no se realizará ningún cargo real'
          ],
          datos: {
            numero: '300 123 4567',
            nombre: 'AgroStock'
          }
        };
      case 'daviplata':
        return {
          icon: <BiWallet className="fs-1" />,
          titulo: 'Pago con Daviplata',
          color: '#E31837',
          instrucciones: [
            'Abre tu app de Daviplata',
            'Selecciona "Pagar"',
            'Escanea el código QR o ingresa el número',
            'Confirma el monto y el pago',
            'Este es un simulador - no se realizará ningún cargo real'
          ],
          datos: {
            numero: '300 123 4567',
            nombre: 'AgroStock'
          }
        };
      case 'pse':
        return {
          icon: <BiCreditCard className="fs-1" />,
          titulo: 'Pago con PSE',
          color: '#0066CC',
          instrucciones: [
            'Serás redirigido a la plataforma PSE',
            'Selecciona tu banco',
            'Ingresa tus credenciales bancarias',
            'Confirma el pago',
            'Este es un simulador - no se realizará ningún cargo real'
          ],
          datos: {
            url: 'https://pse-prueba.agrostock.com',
            referencia: referencia
          }
        };
      default:
        return null;
    }
  };

  const info = getMetodoInfo();
  if (!info) return null;

  if (paso === 'completado') {
    return (
      <div className="payment-simulator payment-completed">
        <div className="payment-success-icon">
          <BiCheckCircle className="text-success" style={{ fontSize: '4rem' }} />
        </div>
        <h4 className="text-success mt-3">¡Pago Completado!</h4>
        <p className="text-muted">El pago ha sido procesado exitosamente</p>
        <div className="payment-details mt-4">
          <div className="detail-item">
            <span className="label">Referencia:</span>
            <span className="value">{referencia}</span>
          </div>
          <div className="detail-item">
            <span className="label">Monto:</span>
            <span className="value">${monto.toLocaleString()}</span>
          </div>
          <div className="detail-item">
            <span className="label">Pedido:</span>
            <span className="value">#{id_pedido}</span>
          </div>
        </div>
      </div>
    );
  }

  if (paso === 'procesando') {
    return (
      <div className="payment-simulator payment-processing">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Procesando...</span>
        </div>
        <h5>Procesando pago...</h5>
        <p className="text-muted">Por favor espera, estamos verificando tu pago</p>
      </div>
    );
  }

  return (
    <div className="payment-simulator">
      <div className="payment-header" style={{ borderColor: info.color }}>
        <div className="payment-icon" style={{ color: info.color }}>
          {info.icon}
        </div>
        <h4 className="mt-3">{info.titulo}</h4>
        <div className="payment-amount">
          <span className="amount-label">Monto a pagar:</span>
          <span className="amount-value">${monto.toLocaleString()}</span>
        </div>
      </div>

      <div className="payment-content">
        <div className="payment-instructions">
          <h6>Instrucciones:</h6>
          <ol>
            {info.instrucciones.map((instruccion, index) => (
              <li key={index}>{instruccion}</li>
            ))}
          </ol>
        </div>

        <div className="payment-data">
          <h6>Datos para el pago:</h6>
          {metodoPago === 'transferencia' && (
            <div className="data-grid">
              <div className="data-item">
                <span className="data-label">Banco:</span>
                <span className="data-value">{info.datos.banco}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Tipo de cuenta:</span>
                <span className="data-value">{info.datos.tipoCuenta}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Número de cuenta:</span>
                <span className="data-value">{info.datos.numeroCuenta}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Titular:</span>
                <span className="data-value">{info.datos.titular}</span>
              </div>
              <div className="data-item">
                <span className="data-label">NIT:</span>
                <span className="data-value">{info.datos.nit}</span>
              </div>
            </div>
          )}

          {(metodoPago === 'nequi' || metodoPago === 'daviplata') && (
            <div className="data-grid">
              <div className="data-item">
                <span className="data-label">Número:</span>
                <span className="data-value">{info.datos.numero}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Nombre:</span>
                <span className="data-value">{info.datos.nombre}</span>
              </div>
            </div>
          )}

          {metodoPago === 'pse' && (
            <div className="data-grid">
              <div className="data-item">
                <span className="data-label">URL:</span>
                <span className="data-value">{info.datos.url}</span>
              </div>
            </div>
          )}

          <div className="payment-reference">
            <div className="reference-header">
              <span className="reference-label">Referencia de pago:</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={copiarReferencia}
                title="Copiar referencia"
              >
                <BiCopy className="me-1" />
                Copiar
              </button>
            </div>
            <div className="reference-value">{referencia}</div>
          </div>
        </div>

        <div className="payment-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
          >
            <BiXCircle className="me-2" />
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={simularPago}
            style={{ backgroundColor: info.color, borderColor: info.color }}
          >
            <BiCheckCircle className="me-2" />
            Simular Pago
          </button>
        </div>

        <div className="payment-warning">
          <small className="text-muted">
            <strong>Nota:</strong> Este es un simulador de pago. No se realizará ningún cargo real.
            En producción, serías redirigido a la plataforma de pago correspondiente.
          </small>
        </div>
      </div>
    </div>
  );
};

export default PaymentSimulator;

