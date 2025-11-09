import React, { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';

import '../../assets/scss/comunidad.scss';

// --- Iconos SVG en línea (versiones pequeñas y controladas) ---
const IconLightBulb = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M11 14a1 1 0 10-2 0v1a1 1 0 102 0v-1z" />
    <path fillRule="evenodd" d="M6 8a4 4 0 118 0c0 1.657-1 2.5-1.5 3-.465.468-1 1-1 2H8.5c-.0-1-0.535-1.532-1-2C7 10.5 6 9.657 6 8z" clipRule="evenodd" />
  </svg>
);

const IconChat = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M2 10c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17.608V10z" />
  </svg>
);

const IconUserCircle = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" preserveAspectRatio="xMidYMid meet" fill="currentColor" {...props}>
    {/* stronger scale + downward nudge so the head never touches the circle border */}
    <g transform="translate(0 2.2) scale(0.75)">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-10a3 3 0 100-6 3 3 0 000 6zm0 2c-2.5 0-4.5 1.5-4.5 3v1h9v-1c0-1.5-2-3-4.5-3z" clipRule="evenodd" />
    </g>
  </svg>
);

const IconPaperAirplane = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);
// --- Fin iconos ---

// --- Datos iniciales de ejemplo (con respuestas) ---
const initialPosts = [
  {
    id: 1,
    user: 'MotoNovato',
    question: '¿Cuál es la mejor moto para un principiante en el enduro?',
    answer: 'Generalmente, se recomienda empezar con una moto de baja cilindrada (125-250cc 2T o 250-400cc 4T), ligera y fácil de manejar. Modelos como la KTM EXC 125/250, Husqvarna TE 250 o Beta RR 300 son opciones populares para empezar en el enduro.',
    responses: [
      { id: 101, user: 'EnduroPro', text: '¡Excelente recomendación! Añadiría la Honda CRF250F también, es muy dócil para aprender.' },
      { id: 102, user: 'TrailRider', text: 'Totalmente de acuerdo, la ligereza es clave al principio.' },
    ]
  },
  {
    id: 2,
    user: 'ViajeroEnDosRuedas',
    question: '¿Qué mantenimiento básico debo hacerle a mi trail antes de un viaje largo por Sudamérica?',
    answer: '¡Gran aventura! Antes de un viaje largo, revisa siempre: \n1. Nivel de aceite y refrigerante.\n2. Presión y estado de los neumáticos (¡y lleva kit de reparación!).\n3. Tensión y lubricación de la cadena.\n4. Funcionamiento de todas las luces y lleva bombillas de repuesto.\n5. Estado de los frenos (líquido y pastillas).',
    responses: [
      { id: 201, user: 'AventureroMX', text: '¡No olvides revisar los rodamientos de rueda y dirección! Un fallo ahí te puede arruinar el viaje.' },
      { id: 202, user: 'MecanicoViajero', text: 'Y un filtro de aire de repuesto, si vas a ir por zonas polvorientas.' },
    ]
  },
  {
    id: 3,
    user: 'CafeRacerFan',
    question: '¿Es legal modificar el chasis de mi moto para convertirla en Cafe Racer?',
    answer: 'Depende mucho de la legislación local y de la magnitud de la modificación. En la mayoría de lugares, las modificaciones estructurales importantes requieren homologación y certificaciones de ingeniería, lo cual puede ser costoso y complejo. Un simple cambio de subchasis o asiento es más fácil de legalizar.',
    responses: [
      { id: 301, user: 'CustomBuilder', text: 'Si cortas el subchasis, en muchos países ya necesitas un informe de un ingeniero. Mejor consulta con un taller especializado o la ITV.' },
    ]
  },
];

// --- Componente para una Respuesta individual ---
function Response({ response }) {
  return (
    <div className="response-item">
      <FaUserCircle className="icon" />
      <div>
        <span className="response-user">@{response.user}</span>
        <p className="response-text">{response.text}</p>
      </div>
    </div>
  );
}

// --- Componente para el formulario de añadir Respuesta ---
function AddResponseForm({ postId, onAddResponse }) {
  const [responseText, setResponseText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (responseText.trim() === '') return;

    onAddResponse(postId, {
      id: Date.now(),
      user: 'Respondedor',
      text: responseText,
    });
    setResponseText('');
  };

  return (
    <form onSubmit={handleSubmit} className="add-response-form">
      <input
        type="text"
        className="input-response"
        placeholder="Tu respuesta..."
        value={responseText}
        onChange={(e) => setResponseText(e.target.value)}
      />
      <button type="submit" className="btn small-send" title="Enviar respuesta" aria-label="Enviar respuesta">
        <IconPaperAirplane className="icon-send" />
      </button>
    </form>
  );
}

// --- Componente para una sola publicación (Pregunta y Respuestas) ---
function PostCard({ post, onAddResponse }) {
  const [showResponses, setShowResponses] = useState(false);

  return (
    <div className="post-card-inner">
      <div className="post-header">
        <FaUserCircle className="icon-user" />
        <div>
          <div className="author">Pregunta de:</div>
          <h3 className="post-question">{post.question}</h3>
        </div>
      </div>

      <div className="lead-box">
        <div className="lead-inner">
          <div className="lead-text-wrap">
            <IconLightBulb className="icon-bulb" />
            <p className="lead-text">{post.answer}</p>
          </div>
          {post.image && (
            <div className="post-image-wrap">
              <img src={post.image} alt="adjunto" className="post-image" />
            </div>
          )}
        </div>
      </div>

      <button className="toggle-responses" onClick={() => setShowResponses(!showResponses)}>
        <IconChat className="icon-chat" /> {showResponses ? 'Ocultar' : 'Ver'} {post.responses.length} Respuestas
      </button>

      {showResponses && (
        <div className="responses-section">
          <h4>Comentarios:</h4>
          <div className="responses-list">
            {post.responses.map(response => (
              <Response key={response.id} response={response} />
            ))}
          </div>
          <AddResponseForm postId={post.id} onAddResponse={onAddResponse} />
        </div>
      )}
    </div>
  );
}

// --- Componente para el formulario de nueva pregunta ---
function NewQuestionForm({ onAddPost }) {
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newQuestion.trim() === '') return;

    const newPost = {
      id: Date.now(),
      user: 'NuevoUsuario', // Simulado
      question: newQuestion,
      answer: 'Tu pregunta está en espera de respuestas. ¡La comunidad te ayudará pronto!',
      image: selectedImage || null,
      responses: []
    };

    onAddPost(newPost);
    setNewQuestion('');
    if (selectedImage) {
      // Revoke the object URL after use to avoid memory leaks
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return setSelectedImage(null);
    // revoke previous if any
    if (selectedImage) URL.revokeObjectURL(selectedImage);
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setSelectedFileName(file.name);
  };

  useEffect(() => {
    return () => {
      if (selectedImage) URL.revokeObjectURL(selectedImage);
    };
  }, [selectedImage]);

  return (
    <div className="new-question-card">
      <div className="new-question-header">
        <IconLightBulb className="hero-icon" />
        <div>
          <h2 className="new-question-title">¿Tienes una chispa de duda?</h2>
          <p className="new-question-sub">¡La comunidad motera está lista para ayudarte! Pregúntales lo que quieras.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          className="question-textarea"
          rows="5"
          placeholder="Ej: ¿Qué tipo de aceite es el mejor para una moto deportiva en clima cálido?"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
        ></textarea>
        <div className="question-file-row">
          {/* Hidden native input; we trigger it from the custom button so we can control label text */}
          <input id="question-file-input" type="file" accept="image/*" onChange={handleFileChange} className="question-file-input" style={{ display: 'none' }} />

          {/* Label above the button */}
          <div className="question-file-control">
            <label className="question-file-label">Imagen</label>
            <button type="button" className="question-file-button" onClick={() => document.getElementById('question-file-input').click()}>
              Choose file
            </button>
          </div>

          <span className="question-file-name">{selectedFileName || 'No file chosen'}</span>
          {selectedImage && <img src={selectedImage} alt="preview" className="question-preview" />}
        </div>
        <button
          type="submit"
          className="btn btn-primary full-width submit-question"
        >
          <IconPaperAirplane className="icon-send" />
          ¡Lanza tu Pregunta!
        </button>
      </form>
    </div>
  );
}

// --- Componente Principal de la App ---
export default function App() {
  const [posts, setPosts] = useState(initialPosts);
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false);

  // Función para añadir un nuevo post al principio de la lista
  const addPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  // Función para añadir una respuesta a un post específico
  const addResponse = (postId, newResponse) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, responses: [...post.responses, newResponse] }
        : post
    ));
  };

  // Cerrar modal con Escape
  useEffect(() => {
    if (!showNewQuestionModal) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setShowNewQuestionModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showNewQuestionModal]);

  return (
    <div className="comunidad-page">
      <section className="community-hero">
        <div className="hero-text">
          <h1>Tu espacio motero</h1>
          <p>Este es tu espacio para hablar, aprender y compartir sobre motos y más.</p>
        </div>
        <div className="hero-cta">
          <button className="hero-sell-btn" onClick={() => setShowNewQuestionModal(true)}>¡Pregunta ahora!</button>
        </div>
      </section>

      <main>
        {/* El formulario ahora se muestra en un modal cuando el usuario hace click en el hero */}

        <h2 className="section-title">Preguntas Recientes de la Comunidad</h2>

        <div className="posts-list">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onAddResponse={addResponse} />
          ))}
        </div>
      </main>

      {/* Modal para crear nueva pregunta */}
      {showNewQuestionModal && (
        <div className="comunidad-modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowNewQuestionModal(false)}>
          <div className="comunidad-modal" role="document" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowNewQuestionModal(false)} aria-label="Cerrar">×</button>
            <NewQuestionForm
              onAddPost={(post) => {
                addPost(post);
                setShowNewQuestionModal(false);
              }}
            />
          </div>
        </div>
      )}

      
    </div>
  );
}