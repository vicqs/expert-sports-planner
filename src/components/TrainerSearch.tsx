import React, { useState, useEffect } from "react";
import { useMockDatabase } from "../context/MockDatabase";
import { useAuth } from "../context/AuthContext";
import { Card, Button, useToast } from "./ui";
import {
  Search,
  User,
  Send,
  CheckCircle,
  Clock,
  X,
  SearchX,
} from "lucide-react";
import { motion } from "framer-motion";

const TrainerSearch = ({ onCancel }) => {
  const {
    getAllTrainers,
    sendTrainerRequest,
    getAthletePendingRequest,
    getAthleteTrainer,
  } = useMockDatabase();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [trainers, setTrainers] = useState<any[]>([]);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [currentTrainer, setCurrentTrainer] = useState<any>(null);
  const [sendingId, setSendingId] = useState<any>(null);
  const [justSentId, setJustSentId] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Las funciones de MockDatabase no están memoizadas; este efecto está
  // pensado para ejecutarse una sola vez al montar el componente.
  useEffect(() => {
    // Pequeño delay artificial: el mock resuelve instantáneo, pero un
    // parpadeo de skeleton por debajo de ~120ms se ve como un glitch, no
    // como carga real. 350ms es suficiente para que el skeleton se perciba
    // sin sentirse lento.
    const timer = setTimeout(() => {
      // Cargar entrenadores
      const allTrainers = getAllTrainers();
      setTrainers(allTrainers);

      // Verificar si ya tiene solicitud pendiente
      const pending = getAthletePendingRequest(currentUser.id);
      setPendingRequest(pending);

      // Verificar si ya tiene entrenador asignado
      const trainer = getAthleteTrainer(currentUser.id);
      setCurrentTrainer(trainer);
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSendRequest = (trainer) => {
    setSendingId(trainer.id);
    // Small delay so the loading state is perceptible before it morphs to "pending"
    setTimeout(() => {
      const result = sendTrainerRequest(currentUser.id, trainer.id);
      setSendingId(null);
      if (result.success) {
        addToast(`Solicitud enviada a ${trainer.name}`, "success");
        setJustSentId(trainer.id);
        setTimeout(() => setPendingRequest(result.request), 900);
      } else {
        addToast(result.message, "warning");
      }
    }, 500);
  };

  // Si ya tiene un entrenador asignado
  if (currentTrainer) {
    return (
      <div className="trainer-search">
        <Card className="trainer-assigned">
          <div className="success-header">
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <CheckCircle size={48} color="var(--color-success)" />
            </motion.div>
            <h3>Vinculado con Entrenador</h3>
          </div>
          <div className="trainer-info">
            <div className="trainer-avatar">
              <User size={32} />
            </div>
            <div>
              <h4>{currentTrainer.name}</h4>
              <p className="muted">Tu entrenador asignado</p>
            </div>
          </div>
          <p className="info-text">
            Tu entrenador puede crear planes de entrenamiento personalizados
            para ti. Asegúrate de mantener tu suscripción al día.
          </p>
          <Button variant="secondary" onClick={onCancel}>
            Volver al Dashboard
          </Button>
        </Card>

        <style>{`
          .trainer-search {
            max-width: 600px;
            margin: 2rem auto;
            padding: 1rem;
          }
          .trainer-assigned {
            text-align: center;
            padding: 2rem;
          }
          .success-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
          }
          .success-header h3 {
            margin: 0;
            color: var(--color-text);
            font-size: 1.5rem;
          }
          .trainer-info {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1.5rem;
            background: var(--color-surface-raised);
            border-radius: var(--radius-lg);
            margin-bottom: 1.5rem;
            justify-content: center;
          }
          .trainer-avatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--color-primary), #3b82f6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .trainer-info h4 {
            margin: 0;
            color: var(--color-text);
            font-size: 1.25rem;
          }
          .trainer-info .muted {
            margin: 0.25rem 0 0 0;
            color: var(--color-text-secondary);
            font-size: 0.9rem;
          }
          .info-text {
            color: var(--color-text-secondary);
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }
        `}</style>
      </div>
    );
  }

  // Si tiene una solicitud pendiente
  if (pendingRequest) {
    return (
      <div className="trainer-search">
        <Card className="pending-request">
          <div className="pending-header">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Clock size={48} color="var(--color-warning)" />
            </motion.div>
            <h3>Solicitud Pendiente</h3>
          </div>
          <p>
            Has enviado una solicitud a{" "}
            <strong>{pendingRequest.trainerName}</strong>
          </p>
          <p className="muted">
            El entrenador revisará tu solicitud pronto. Te notificaremos cuando
            sea aceptada.
          </p>
          <div className="request-details">
            <small>
              Enviada el{" "}
              {new Date(pendingRequest.createdAt).toLocaleDateString()}
            </small>
          </div>
          <Button variant="secondary" onClick={onCancel}>
            Volver al Dashboard
          </Button>
        </Card>

        <style>{`
          .trainer-search {
            max-width: 600px;
            margin: 2rem auto;
            padding: 1rem;
          }
          .pending-request {
            text-align: center;
            padding: 2rem;
          }
          .pending-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .pending-header h3 {
            margin: 0;
            color: var(--color-text);
            font-size: 1.5rem;
          }
          .pending-request p {
            margin: 0.75rem 0;
            color: var(--color-text);
            font-size: 1rem;
          }
          .pending-request .muted {
            color: var(--color-text-secondary);
            font-size: 0.9rem;
          }
          .request-details {
            margin: 1.5rem 0;
            padding: 1rem;
            background: var(--color-surface-raised);
            border-radius: var(--radius-md);
          }
          .request-details small {
            color: var(--color-text-muted);
          }
        `}</style>
      </div>
    );
  }

  // Vista de búsqueda de entrenadores
  return (
    <div className="trainer-search">
      <div className="search-header">
        <h2>Buscar Entrenador</h2>
        <p>Encuentra un entrenador por nombre o código</p>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre, email o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            className="clear-btn"
            onClick={() => setSearchTerm("")}
            aria-label="Borrar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="trainers-list">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="trainer-card-skeleton">
              <div className="skeleton-avatar" />
              <div className="skeleton-lines">
                <div className="skeleton-line skeleton-line-lg" />
                <div className="skeleton-line skeleton-line-sm" />
              </div>
              <div className="skeleton-btn" />
            </Card>
          ))
        ) : filteredTrainers.length === 0 ? (
          <Card className="no-results">
            <SearchX size={36} color="var(--color-text-subtle)" />
            <p>No se encontraron entrenadores</p>
            <span className="hint">
              Prueba con otro nombre, o pide a tu entrenador su código exacto.
            </span>
          </Card>
        ) : (
          filteredTrainers.map((trainer) => (
            <Card key={trainer.id} className="trainer-card">
              <div className="trainer-card-content">
                <div className="trainer-avatar">
                  <User size={24} />
                </div>
                <div className="trainer-details">
                  <h4>{trainer.name}</h4>
                  <p className="trainer-email">{trainer.email}</p>
                  <span className="trainer-code">Código: {trainer.code}</span>
                </div>
              </div>
              <Button
                variant={justSentId === trainer.id ? "success" : "primary"}
                leftIcon={
                  justSentId === trainer.id ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Send size={16} />
                  )
                }
                loading={sendingId === trainer.id}
                disabled={sendingId === trainer.id || justSentId === trainer.id}
                onClick={() => handleSendRequest(trainer)}
              >
                {sendingId === trainer.id
                  ? "Enviando…"
                  : justSentId === trainer.id
                    ? "¡Solicitud enviada!"
                    : "Enviar Solicitud"}
              </Button>
            </Card>
          ))
        )}
      </div>

      <div className="actions">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      <style>{`
        .trainer-search {
          max-width: 800px;
          margin: 0 auto;
          padding: 1rem;
        }
        .search-header {
          margin-bottom: 2rem;
        }
        .search-header h2 {
          margin: 0 0 0.5rem 0;
          color: var(--color-text);
          font-size: 1.75rem;
        }
        .search-header p {
          margin: 0;
          color: var(--color-text-secondary);
        }
        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          margin-bottom: 1.5rem;
          transition: all 0.2s;
        }
        .search-bar:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
        .search-bar svg {
          color: var(--color-text-muted);
          flex-shrink: 0;
        }
        .search-bar input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          color: var(--color-text);
          font-size: 1rem;
        }
        .clear-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          padding: 0.5rem;
          min-width: var(--touch-target-min, 44px);
          min-height: var(--touch-target-min, 44px);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }
        .clear-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
        .trainers-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .trainer-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          gap: 1rem;
          transition: all 0.2s;
        }
        .trainer-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .trainer-card-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }
        .trainer-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), #3b82f6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .trainer-details {
          flex: 1;
        }
        .trainer-details h4 {
          margin: 0 0 0.25rem 0;
          color: var(--color-text);
          font-size: 1.1rem;
        }
        .trainer-email {
          margin: 0.25rem 0;
          color: var(--color-text-secondary);
          font-size: 0.9rem;
        }
        .trainer-code {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: rgba(139, 92, 246, 0.1);
          color: var(--color-primary);
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 0.5rem;
        }
        .no-results {
          text-align: center;
          padding: 3rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .no-results p {
          margin: 0;
          color: var(--color-text-secondary);
          font-weight: 600;
        }
        .no-results .hint {
          color: var(--color-text-muted);
          font-size: 0.85rem;
          max-width: 320px;
        }

        /* ---- Skeleton loader (matches trainer-card layout) ---- */
        .trainer-card-skeleton {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
        }
        .skeleton-avatar,
        .skeleton-line,
        .skeleton-btn {
          background: linear-gradient(
            90deg,
            var(--color-bg-elevated) 25%,
            var(--color-surface-hover) 37%,
            var(--color-bg-elevated) 63%
          );
          background-size: 400% 100%;
          animation: skeletonShimmer 1.4s ease-in-out infinite;
          border-radius: var(--radius-sm);
        }
        .skeleton-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .skeleton-lines {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .skeleton-line-lg { height: 16px; width: 60%; }
        .skeleton-line-sm { height: 12px; width: 40%; }
        .skeleton-btn {
          width: 120px;
          height: var(--touch-target-min);
          flex-shrink: 0;
        }
        @keyframes skeletonShimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
        @media (max-width: 768px) {
          .trainer-card-skeleton {
            flex-wrap: wrap;
          }
          .skeleton-btn {
            width: 100%;
          }
        }
        .actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }
        @media (max-width: 768px) {
          .trainer-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .trainer-card-content {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default TrainerSearch;
