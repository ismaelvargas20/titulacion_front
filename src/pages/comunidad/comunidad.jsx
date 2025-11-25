import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaUserCircle, FaEdit, FaTimes, FaCheck, FaReply, FaTrash } from 'react-icons/fa';

import '../../assets/scss/comunidad.scss';
import * as comunidad from '../../services/comunidad';
import api from '../../api/axios';
import Swal from 'sweetalert2';

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

// Empezamos con lista vacía; cargaremos desde backend
const initialPosts = [];

// Helper: renderiza el cuerpo de un hilo detectando marcadores de imagen.
function RenderBody({ body, image }) {
  if (!body && !image) return null;
  // si el frontend ya tiene image (dataURL o URL), mostrarla primero
  if (image) {
    return (
      <>
        {body && <p className="lead-text">{body}</p>}
        <div className="post-image-wrap">
          <img src={image} alt="adjunto" className="post-image" />
        </div>
      </>
    );
  }

  // detectar marcador [IMG]/uploads/...
    try {
    const imgRegex = /\[IMG\](\/uploads\/hilos\/[0-9]+\/[\w\-_.]+\.(?:png|jpg|jpeg|gif|webp))/i;
    const m = body ? body.match(imgRegex) : null;
    if (m) {
      const imgPath = m[1];
      const textOnly = body.replace(imgRegex, '').trim();
      // Si la app corre en CRA (puerto 3000) la ruta relativa fallará al recargar;
      // forzamos la URL absoluta hacia el backend configurado en `api`.
      const base = (api && api.defaults && api.defaults.baseURL) ? api.defaults.baseURL.replace(/\/$/, '') : '';
      const src = base + imgPath;
      return (
        <>
          {textOnly ? <p className="lead-text">{textOnly}</p> : null}
          <div className="post-image-wrap">
            <img src={src} alt="adjunto" className="post-image" />
          </div>
        </>
      );
    }
  } catch (e) {
    console.warn('Error parsing body for image:', e);
  }

  return <p className="lead-text">{body}</p>;
}

// --- Componente para una Respuesta individual ---
function Response({ response, onUpdate, onDelete, onReply }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(response.text);

  useEffect(() => {
    setText(response.text);
  }, [response.text]);

  const save = () => {
    const newText = (text || '').trim();
    if (newText === '') return; // no permitimos vacío
    // llamar al backend para persistir la edición vía onUpdate (PostCard hará la llamada)
    onUpdate(response.id, newText);
    setEditing(false);
  };

  
  return (
    <div id={`response-${response.id}`} className="response-item">
      <FaUserCircle className="icon" />
      <div style={{ flex: 1 }}>
        {(() => {
          let isOwner = false;
          try {
            const currentRaw = sessionStorage.getItem('currentUser');
            const current = currentRaw ? JSON.parse(currentRaw) : null;
            isOwner = current && current.id && response.clienteId && String(current.id) === String(response.clienteId);
          } catch (e) {}
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <span className="response-user">@{response.user}</span>
              </div>
              <div className="response-actions">
                {!editing && (
                  <>
                    {/* Reply visible to everyone */}
                    <button className="btn icon-btn" title="Responder" onClick={() => { if (onReply) onReply(response.id); }}><FaReply /></button>
                    {/* Edit/Delete only for owner */}
                    {isOwner && (
                      <>
                        <button className="btn icon-btn" title="Editar" onClick={() => setEditing(true)}><FaEdit /></button>
                        <button className="btn icon-btn danger" title="Eliminar" onClick={async () => {
                          const result = await Swal.fire({
                            title: '¿Estás seguro?',
                            text: '¿Seguro que quieres eliminar tu comentario?',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Sí, eliminar',
                            cancelButtonText: 'Cancelar'
                          });
                          if (result && result.isConfirmed) {
                            onDelete(response.id);
                          }
                        }}><FaTimes /></button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}

            { !editing && (
              response.estado === 'eliminado'
                ? <p className="response-text"><em>Comentario eliminado</em></p>
                : <p className="response-text">{response.text}</p>
            )}

        {editing && (
            <div className="response-edit-form">
            <textarea className="input-response" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={(e) => { e.preventDefault(); save(); }}>Guardar</button>
              <button className="btn" onClick={(e) => { e.preventDefault(); setEditing(false); setText(response.text); }}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Componente para el formulario de añadir Respuesta ---
function AddResponseForm({ postId, onAddResponse, parentId, onCancelReply }) {
  const [responseText, setResponseText] = useState('');
  // parentId puede ser un número o un objeto { id, name }
  const parent = (parentId && typeof parentId === 'object') ? parentId : (parentId ? { id: parentId, name: null } : null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (responseText.trim() === '') return;

    // Enviar al backend; si falla, añadir localmente
    (async () => {
      // intentar obtener usuario/cliente actual para evitar errores de FK en backend
      let payload = { cuerpo: responseText };
      if (parent) payload.padreId = parent.id;
      try {
        const currentRaw = sessionStorage.getItem('currentUser');
        const current = currentRaw ? JSON.parse(currentRaw) : null;
        if (current && current.id) {
          payload.usuarioId = current.id;
          payload.clienteId = current.id;
          if (current.nombre || current.name) payload.autor_nombre = current.nombre || current.name;
        }

        const json = await comunidad.crearRespuesta(postId, payload);
        if (json && json.respuesta) {
          const r = json.respuesta;
          const authorName = r.autor_nombre || (current && (current.nombre || current.name)) || 'Respondedor';
          onAddResponse(postId, { id: r.id, user: authorName, text: r.cuerpo, clienteId: r.clienteId || (current && current.id), padreId: r.padreId });
        } else {
          const fallbackUser = (current && (current.nombre || current.name)) || 'Respondedor';
          onAddResponse(postId, { id: Date.now(), user: fallbackUser, text: responseText, clienteId: current && current.id, padreId: parent ? parent.id : null });
        }
      } catch (err) {
        console.warn('No se pudo enviar respuesta al servidor, fallback local:', err);
        // mostrar alerta con detalle si está disponible
        try {
          const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
          Swal.fire({ icon: 'error', title: 'Error al enviar respuesta', text: String(msg).slice(0, 300) });
        } catch (e) {}
        const fallbackUser = (sessionStorage.getItem('currentUser') && (JSON.parse(sessionStorage.getItem('currentUser')).nombre || JSON.parse(sessionStorage.getItem('currentUser')).name)) || 'Respondedor';
        const fallbackClienteId = (sessionStorage.getItem('currentUser') && JSON.parse(sessionStorage.getItem('currentUser')).id) || null;
        onAddResponse(postId, { id: Date.now(), user: fallbackUser, text: responseText, clienteId: fallbackClienteId, padreId: parent ? parent.id : null });
      }
      setResponseText('');
      if (onCancelReply) onCancelReply();
    })();
  };

  return (
    <form onSubmit={handleSubmit} className="add-response-form">
      {parent ? (
        <div className="replying-row">
          <small className="replying-to">Respondiendo a <span className="replying-to-name">{parent.name ? `@${parent.name}` : `#${parent.id}`}</span></small>
          <button type="button" className="btn" onClick={() => { if (onCancelReply) onCancelReply(); }}>Cancelar</button>
        </div>
      ) : null}
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
function PostCard({ post, onAddResponse, onOpen, onUpdatePost }) {
  const [showResponses, setShowResponses] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(post.question || '');
  
  let isOwner = false;
  try {
    const currentRaw = sessionStorage.getItem('currentUser');
    const current = currentRaw ? JSON.parse(currentRaw) : null;
    isOwner = current && current.id && post && post.clienteId && String(current.id) === String(post.clienteId);
  } catch (e) {}

  return (
    <div className="post-card-inner" id={`hilo-${post.id}`}>
      <div className="post-header">
        <FaUserCircle className="icon-user" />
        <div style={{ flex: 1 }}>
          <div className="author">Pregunta de: <span className="author-name">{post.user}</span></div>
          {!editing ? (
            <h3 className="post-question" style={{ margin: 0 }}>{post.question}</h3>
          ) : (
            <div className="edit-box">
              <input className="input-edit-title" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} />
              <div className="edit-actions">
                <button className="btn btn-primary btn-save" onClick={async (e) => {
                  e.preventDefault();
                  const newTitle = (editingTitle || '').trim();
                  if (!newTitle) return;
                  try {
                    const currentRaw = sessionStorage.getItem('currentUser');
                    const current = currentRaw ? JSON.parse(currentRaw) : null;
                    const payload = { titulo: newTitle };
                    if (current && current.id) payload.clienteId = current.id;
                    const json = await comunidad.actualizarHilo(post.id, payload);
                    if (json && json.hilo) {
                      if (onUpdatePost) onUpdatePost(post.id, { question: json.hilo.titulo, clienteId: json.hilo.clienteId });
                      try { Swal.fire({ icon: 'success', title: 'Pregunta actualizada' }); } catch (e) {}
                    }
                    setEditing(false);
                  } catch (err) {
                    console.warn('Error actualizando hilo:', err);
                    try {
                      const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
                      Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: String(msg).slice(0, 300) });
                    } catch (e) {}
                  }
                }}><FaCheck style={{ marginRight: 6 }} />Guardar</button>
                <button className="btn btn-cancel" onClick={(e) => { e.preventDefault(); setEditing(false); setEditingTitle(post.question || ''); }}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
        <div className="post-header-actions">
          {isOwner && !editing && (
            <>
              <button className="btn icon-btn edit-icon" title="Editar pregunta" onClick={() => { setEditing(true); setEditingTitle(post.question || ''); }}><FaEdit /></button>
              {/* Eliminar pregunta (visible solo para el propietario) */}
              <button className="btn icon-btn danger" title="Eliminar pregunta" onClick={async (e) => {
                e.preventDefault();
                try {
                  const result = await Swal.fire({
                    title: 'Eliminar pregunta',
                    text: '¿Seguro que quieres eliminar esta pregunta? Esta acción puede eliminar también las respuestas.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                  });
                  if (!(result && result.isConfirmed)) return;

                  // Intentar eliminar en backend usando endpoint DELETE /hilos/:id si existe
                  try {
                    await comunidad.eliminarHilo(post.id);
                    try { Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Pregunta eliminada', showConfirmButton: false, timer: 1800 }); } catch (e) {}
                    if (onUpdatePost) onUpdatePost(post.id, { deleted: true });
                    return;
                  } catch (errDelete) {
                    console.warn('Eliminar hilo via DELETE falló, intentando marcar como eliminado:', errDelete);
                    // fallback: marcar hilo como 'eliminado' usando actualizarHilo (si backend soporta estado)
                    try {
                      await comunidad.actualizarHilo(post.id, { estado: 'eliminado' });
                      try { Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Pregunta marcada como eliminada', showConfirmButton: false, timer: 1800 }); } catch (e) {}
                      if (onUpdatePost) onUpdatePost(post.id, { deleted: true });
                      return;
                    } catch (errUpdate) {
                      console.error('No se pudo eliminar ni marcar como eliminado el hilo:', errUpdate);
                      try { Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: 'Intenta nuevamente más tarde' }); } catch (e) {}
                    }
                  }
                } catch (err) {
                  console.warn('Error eliminando pregunta:', err);
                }
              }}><FaTrash /></button>
            </>
          )}
        </div>
      </div>

      <div className="lead-box">
        <div className="lead-inner">
          <div className="lead-text-wrap">
            <IconLightBulb className="icon-bulb" />
            {/* Mostrar primero la primera respuesta si existe; si no, usar post.answer (valor histórico).
              Además detectar marcadores [IMG] y mostrar imágenes correctamente */}
            { (post.responses && post.responses.length)
              ? <p className="lead-text">{post.responses[post.responses.length - 1].text}</p>
              : <RenderBody body={post.answer} image={post.image} />
            }
          </div>
          
        </div>
      </div>

      <button className="toggle-responses" onClick={() => {
        const next = !showResponses;
        setShowResponses(next);
        if (next && onOpen && Array.isArray(post.responses) && post.responses.length === 0) {
          onOpen(post.id);
        }
      }}>
        <IconChat className="icon-chat" /> {showResponses ? 'Ocultar' : 'Ver'} {(post.responses && post.responses.length) ? post.responses.length : (post.responsesCount || 0)} Respuestas
      </button>

      {showResponses && (
        <div className="responses-section">
          <h4>Comentarios:</h4>
          <div className="responses-list">
            {(() => {
              // construir árbol simple: padres (padreId == null) y children agrupados por padreId
              const all = Array.isArray(post.responses) ? post.responses : [];
              const parents = all.filter(r => !r.padreId);
              const childrenMap = {};
              all.filter(r => r.padreId).forEach(c => {
                if (!childrenMap[c.padreId]) childrenMap[c.padreId] = [];
                childrenMap[c.padreId].push(c);
              });

              // si no hay padres pero sí hijos (edge case), mostrarlos plano
              if (parents.length === 0 && Object.keys(childrenMap).length > 0) {
                return all.map(response => (
                  <Response
                    key={response.id}
                    response={response}
                    onUpdate={async (responseId, newText) => {
                      try {
                        const json = await comunidad.actualizarRespuesta(responseId, { cuerpo: newText });
                        if (json && json.respuesta) {
                          const r = json.respuesta;
                          onAddResponse(post.id, { id: r.id, user: r.autor_nombre || response.user, text: r.cuerpo, clienteId: r.clienteId || response.clienteId, _update: true });
                          try { Swal.fire({ icon: 'success', title: 'Respuesta actualizada' }); } catch (e) {}
                        } else {
                          onAddResponse(post.id, { id: responseId, user: response.user, text: newText, _update: true });
                        }
                      } catch (err) {
                        console.warn('No se pudo actualizar la respuesta en el servidor:', err);
                        try {
                          const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
                          Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: String(msg).slice(0, 300) });
                        } catch (e) {}
                        onAddResponse(post.id, { id: responseId, user: response.user, text: newText, _update: true });
                      }
                    }}
                    onDelete={async (responseId) => {
                      try {
                        await comunidad.eliminarRespuesta(responseId);
                        onAddResponse(post.id, { id: responseId, estado: 'eliminado', _update: true });
                        try { Swal.fire({ icon: 'success', title: 'Comentario eliminado' }); } catch (e) {}
                      } catch (err) {
                        console.warn('No se pudo eliminar la respuesta en el servidor:', err);
                        try {
                          const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
                          Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: String(msg).slice(0, 300) });
                        } catch (e) {}
                        onAddResponse(post.id, { id: responseId, _delete: true });
                      }
                    }}
                    onReply={() => setReplyTo({ id: response.id, name: response.user })}
                  />
                ));
              }

              // renderizar padres y sus hijos
              return parents.map(parent => (
                <div key={parent.id} className="response-parent">
                  <Response
                    response={parent}
                    onUpdate={async (responseId, newText) => {
                      try {
                        const json = await comunidad.actualizarRespuesta(responseId, { cuerpo: newText });
                        if (json && json.respuesta) {
                          const r = json.respuesta;
                          onAddResponse(post.id, { id: r.id, user: r.autor_nombre || parent.user, text: r.cuerpo, clienteId: r.clienteId || parent.clienteId, _update: true });
                          try { Swal.fire({ icon: 'success', title: 'Respuesta actualizada' }); } catch (e) {}
                        } else {
                          onAddResponse(post.id, { id: responseId, user: parent.user, text: newText, _update: true });
                        }
                      } catch (err) {
                        console.warn('No se pudo actualizar la respuesta en el servidor:', err);
                        try {
                          const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
                          Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: String(msg).slice(0, 300) });
                        } catch (e) {}
                        onAddResponse(post.id, { id: responseId, user: parent.user, text: newText, _update: true });
                      }
                    }}
                    onDelete={async (responseId) => {
                      try {
                        await comunidad.eliminarRespuesta(responseId);
                        onAddResponse(post.id, { id: responseId, estado: 'eliminado', _update: true });
                        try { Swal.fire({ icon: 'success', title: 'Comentario eliminado' }); } catch (e) {}
                      } catch (err) {
                        console.warn('No se pudo eliminar la respuesta en el servidor:', err);
                        try {
                          const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
                          Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: String(msg).slice(0, 300) });
                        } catch (e) {}
                        onAddResponse(post.id, { id: responseId, _delete: true });
                      }
                    }}
                    onReply={() => setReplyTo({ id: parent.id, name: parent.user })}
                  />

                  {childrenMap[parent.id] && childrenMap[parent.id].map(child => (
                    <div key={child.id} className="child-response" style={{ marginLeft: 28 }}>
                      <Response
                        response={child}
                        onUpdate={async (responseId, newText) => {
                          try {
                            const json = await comunidad.actualizarRespuesta(responseId, { cuerpo: newText });
                            if (json && json.respuesta) {
                              const r = json.respuesta;
                              onAddResponse(post.id, { id: r.id, user: r.autor_nombre || child.user, text: r.cuerpo, clienteId: r.clienteId || child.clienteId, _update: true });
                              try { Swal.fire({ icon: 'success', title: 'Respuesta actualizada' }); } catch (e) {}
                            } else {
                              onAddResponse(post.id, { id: responseId, user: child.user, text: newText, _update: true });
                            }
                          } catch (err) {
                            console.warn('No se pudo actualizar la respuesta en el servidor:', err);
                            try {
                              const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
                              Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: String(msg).slice(0, 300) });
                            } catch (e) {}
                            onAddResponse(post.id, { id: responseId, user: child.user, text: newText, _update: true });
                          }
                        }}
                        onDelete={async (responseId) => {
                          try {
                            await comunidad.eliminarRespuesta(responseId);
                            onAddResponse(post.id, { id: responseId, estado: 'eliminado', _update: true });
                            try { Swal.fire({ icon: 'success', title: 'Comentario eliminado' }); } catch (e) {}
                          } catch (err) {
                            console.warn('No se pudo eliminar la respuesta en el servidor:', err);
                            try {
                              const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
                              Swal.fire({ icon: 'error', title: 'No se pudo eliminar', text: String(msg).slice(0, 300) });
                            } catch (e) {}
                            onAddResponse(post.id, { id: responseId, _delete: true });
                          }
                        }}
                        onReply={() => setReplyTo({ id: child.id, name: child.user })}
                      />
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>
          <AddResponseForm postId={post.id} onAddResponse={onAddResponse} parentId={replyTo} onCancelReply={() => setReplyTo(null)} />
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
    // Intentar enviar al backend; si falla, añadir localmente como fallback
    (async () => {
      try {
        // intentar incluir cliente/usuario actual para evitar errores de FK
        const currentRaw = sessionStorage.getItem('currentUser');
        const current = currentRaw ? JSON.parse(currentRaw) : null;
        const payload = {
          titulo: newQuestion,
          cuerpo: null,
          image: selectedImage || null
        };
        if (current && current.id) {
          payload.usuarioId = current.id;
          payload.clienteId = current.id;
          // si hay nombre disponible, usarlo
          if (current.nombre || current.name) payload.autor_nombre = current.nombre || current.name;
        }

        const json = await comunidad.crearHilo(payload);
        if (json && json.hilo) {
          onAddPost({ id: json.hilo.id, user: json.hilo.autor_nombre || 'NuevoUsuario', question: json.hilo.titulo, answer: null, image: selectedImage || null, responses: [] });
          try { Swal.fire({ icon: 'success', title: 'Pregunta creada', text: 'Tu pregunta se publicó correctamente.' }); } catch (e) {}
        } else {
          // fallback local
          onAddPost({ id: Date.now(), user: 'NuevoUsuario', question: newQuestion, answer: null, image: selectedImage || null, responses: [] });
          try { Swal.fire({ icon: 'info', title: 'Pregunta guardada localmente', text: 'Se creó localmente porque el servidor no respondió.' }); } catch (e) {}
        }
      } catch (err) {
        console.warn('No se pudo crear hilo en el servidor, fallback a local:', err);
        try {
          const msg = (err && err.response && (err.response.data && (err.response.data.error || err.response.data.message))) || err.message || String(err);
          Swal.fire({ icon: 'error', title: 'No se pudo crear hilo', text: String(msg).slice(0, 400) });
        } catch (e) {}
        onAddPost({ id: Date.now(), user: 'NuevoUsuario', question: newQuestion, answer: null, image: selectedImage || null, responses: [] });
      }

      setNewQuestion('');
      if (selectedImage) { setSelectedImage(null); setSelectedFileName(null); }
    })();
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return setSelectedImage(null);
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result es dataURL
      setSelectedImage(reader.result);
      setSelectedFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    // No cleanup required for data URLs (we use FileReader -> dataURL)
    return () => {};
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
  const location = useLocation();
  const [posts, setPosts] = useState(initialPosts);
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false);
  const [openThreadId, setOpenThreadId] = useState(null);

  // Cargar hilos reales desde el backend al montar
  useEffect(() => {
    (async () => {
      try {
        const data = await comunidad.listarHilos();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(h => ({
            id: h.id,
            user: h.autor_nombre || 'Anónimo',
            question: h.titulo,
            // mantener clienteId para permitir permisos (editar/eliminar)
            clienteId: h.clienteId || null,
            // Mostrar el cuerpo del hilo si existe, si no intentar usar la última respuesta proporcionada por el backend
            answer: h.cuerpo || (h.ultimaRespuesta ? h.ultimaRespuesta.cuerpo : null),
            image: null,
            responses: [],
            responsesCount: h.respuestasCount || 0
          }));
          setPosts(mapped);
        }
      } catch (err) {
        console.warn('No se pudieron cargar hilos', err);
      }
    })();
  }, []);

  // Función para añadir un nuevo post al principio de la lista
  const addPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  // Función para actualizar un post existente (titulo/campos) en el estado local
  const updatePost = (postId, changes) => {
    // Si el cambio indica borrado, eliminar el post del estado local
    if (changes && (changes.deleted === true || changes._deleted === true)) {
      setPosts(posts.filter(p => p.id !== postId));
      return;
    }
    setPosts(posts.map(p => p.id === postId ? { ...p, ...changes } : p));
  };

  // Función para añadir una respuesta a un post específico
  const addResponse = (postId, newResponse) => {
    // If newResponse contains control flags, handle update/delete
    if (newResponse && newResponse._update) {
      const { id, text, estado, user, clienteId } = newResponse;
      setPosts(posts.map(post => post.id === postId ? {
        ...post,
        responses: post.responses.map(r => r.id === id ? { ...r, ...(text !== undefined ? { text } : {}), ...(estado !== undefined ? { estado } : {}), ...(user ? { user } : {}), ...(clienteId !== undefined ? { clienteId } : {}) } : r)
      } : post));
      // Si la actualización marcó el estado como eliminado, mostrar el texto "Comentario eliminado"
      // y luego eliminar visualmente el comentario pasados 3 segundos (sin tocar la BD)
      if (estado === 'eliminado') {
        setTimeout(() => {
          setPosts(prev => prev.map(p => p.id === postId ? {
            ...p,
            responses: p.responses.filter(r => r.id !== id),
            responsesCount: (typeof p.responsesCount === 'number') ? Math.max(0, p.responsesCount - 1) : p.responsesCount
          } : p));
        }, 3000);
      }
      return;
    }
    if (newResponse && newResponse._delete) {
      const { id } = newResponse;
      // soft-delete locally: marcar estado='eliminado'
      setPosts(posts.map(post => post.id === postId ? {
        ...post,
        responses: post.responses.map(r => r.id === id ? { ...r, estado: 'eliminado' } : r)
      } : post));
      // eliminar visualmente después de 3 segundos
      setTimeout(() => {
        setPosts(prev => prev.map(p => p.id === postId ? {
          ...p,
          responses: p.responses.filter(r => r.id !== id),
          responsesCount: (typeof p.responsesCount === 'number') ? Math.max(0, p.responsesCount - 1) : p.responsesCount
        } : p));
      }, 3000);
      return;
    }

    // normal add
    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, responses: [...post.responses, { ...newResponse, estado: newResponse.estado || 'activo' }] }
        : post
    ));
  };

  // Cargar respuestas de un hilo desde backend
  const loadResponses = async (hiloId) => {
    try {
      const json = await comunidad.detalleHilo(hiloId);
      // Filtrar respuestas marcadas como 'eliminado' en el backend para que no se muestren
      const mapped = (json.respuestas || [])
        .filter(r => ((r.estado || 'activo') !== 'eliminado'))
        .map(r => ({ id: r.id, user: r.autor_nombre || 'Anónimo', text: r.cuerpo, clienteId: r.clienteId || null, padreId: r.padreId || null, estado: r.estado || 'activo' }));
      setPosts(prev => {
        const idx = prev.findIndex(p => String(p.id) === String(hiloId) || Number(p.id) === Number(hiloId));
        if (idx !== -1) {
          return prev.map(p => p.id === parseInt(hiloId, 10) ? {
            ...p,
            responses: mapped,
            responsesCount: mapped.length,
            answer: (mapped.length ? mapped[mapped.length - 1].text : p.answer)
          } : p);
        }

        // Si el hilo no existe en el listado local, creamos un post mínimo para poder hacer scroll
        const hilo = (json.hilo || json.hilo || {});
        const question = (hilo.titulo || hilo.title || hilo.question || `Hilo ${hiloId}`).toString();
        const newPost = {
          id: parseInt(hiloId, 10),
          user: hilo.autor_nombre || hilo.autor || 'Anónimo',
          question,
          answer: (mapped.length ? mapped[mapped.length - 1].text : ''),
          image: hilo.image || null,
          clienteId: hilo.clienteId || null,
          responses: mapped,
          responsesCount: mapped.length
        };
        return [newPost, ...prev];
      });
    } catch (err) {
      console.warn('Error cargando respuestas', err);
    }
  };

  // Helper: intenta obtener un elemento por id/selector varias veces antes de rendirse
  const scrollToElementWithRetry = async (elIdOrSelector, { maxAttempts = 30, interval = 150, offset = 12, preferSelector = false } = {}) => {
    const selector = (typeof elIdOrSelector === 'string' && (elIdOrSelector.startsWith('#') || elIdOrSelector.startsWith('.'))) ? elIdOrSelector : `#${elIdOrSelector}`;
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        const el = preferSelector ? document.querySelector(selector) : document.getElementById(selector.replace(/^#/, ''));
        if (el) {
          // intentar detectar header fijo para compensar desplazamiento
          const header = document.querySelector('header, .app-header, .navbar, .topbar, .main-header');
          const headerHeight = header ? header.getBoundingClientRect().height : 90;
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY - headerHeight - offset;
          window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: 'smooth' });
          return el;
        }
      } catch (e) {
        console.debug('[Comunidad] scrollToElementWithRetry error', e);
      }
      // esperar antes de reintentar
      await new Promise(r => setTimeout(r, interval));
      attempts += 1;
    }
    return null;
  };

  // Manejar hash como: #hilo-<hiloId>-resp-<respId>
  // cuando llega un hash abrimos el hilo, cargamos respuestas y hacemos scroll+animación
  useEffect(() => {
    const handleHash = async () => {
      try {
        const hash = window.location.hash || '';
        try { console.debug('[Comunidad] handleHash run, hash=', hash); } catch (e) {}
        const m = hash.match(/#hilo-(\d+)(?:-resp-(\d+))?/);
        if (!m) return;
        const hiloId = m[1];
        const respId = m[2];
        if (!hiloId) return;
        // marcar hilo a abrir
        setOpenThreadId(hiloId);
        try { console.debug('[Comunidad] parsed hash -> hiloId=', hiloId, 'respId=', respId); } catch (e) {}
        await loadResponses(hiloId);
        // Priorizar scroll al hilo (pregunta). No abrimos la sección de respuestas automáticamente.
        const hiloEl = await scrollToElementWithRetry(`hilo-${hiloId}`, { maxAttempts: 40, interval: 150 });
        if (hiloEl) {
          try {
            // Aplicar highlight suave mediante clase CSS (animación definida en SCSS)
            hiloEl.classList.add('highlight-thread');
            const _onEnd = () => {
              try { hiloEl.classList.remove('highlight-thread'); } catch (e) {}
              hiloEl.removeEventListener('animationend', _onEnd);
            };
            hiloEl.addEventListener('animationend', _onEnd);
          } catch (e) { /* noop */ }
        } else {
          console.debug('[Comunidad] handleHash: no se encontró elemento hilo para', hiloId);
        }
        // Si nos dieron respId y la respuesta ya está renderizada, intentar también desplazarse a ella (no forzamos abrir respuestas)
        if (respId) {
          const respEl = document.getElementById(`response-${respId}`);
          if (respEl) {
            try {
              respEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // aplicar highlight suave a la respuesta
              respEl.classList.add('highlight-response');
              const _onEndR = () => {
                try { respEl.classList.remove('highlight-response'); } catch (e) {}
                respEl.removeEventListener('animationend', _onEndR);
              };
              respEl.addEventListener('animationend', _onEndR);
            } catch (e) { /* noop */ }
          }
        }
      } catch (e) {
        console.warn('Error manejando hash highlight', e);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Si navegamos con `state.scrollQuery`, intentar encontrar el hilo que coincida
  useEffect(() => {
    try {
      const sq = location && location.state && location.state.scrollQuery ? String(location.state.scrollQuery).toLowerCase().trim() : null;
      try { console.debug('[Comunidad] scrollQuery effect, scrollQuery=', sq); } catch (e) {}
      if (!sq) return;
      // buscar entre posts: por título, por answer, o por texto en respuestas
      const found = posts.find(p => {
        if (!p) return false;
        const q = (p.question || '').toString().toLowerCase();
        const a = (p.answer || '').toString().toLowerCase();
        if (q && q.includes(sq)) return true;
        if (a && a.includes(sq)) return true;
        const rs = Array.isArray(p.responses) ? p.responses : [];
        for (let r of rs) {
          const rt = (r.text || r.cuerpo || '').toString().toLowerCase();
          if (rt && rt.includes(sq)) return true;
        }
        return false;
      });
      if (found && found.id) {
        const hiloId = found.id;
        try { console.debug('[Comunidad] scrollQuery matched hiloId=', hiloId, 'question=', found.question); } catch (e) {}
        // Abrir hilo y hacer scroll+parpadeo (reusar la misma lógica que el hash)
        setOpenThreadId(hiloId);
        (async () => {
          const hiloEl = await scrollToElementWithRetry(`hilo-${hiloId}`, { maxAttempts: 40, interval: 150 });
          if (hiloEl) {
            try {
              // parpadeo azul: 3 flashes
              let flashes = 0;
              const doFlash = () => {
                if (!hiloEl) return;
                hiloEl.style.transition = 'background-color 0.25s ease';
                hiloEl.style.backgroundColor = 'rgba(0,123,255,0.18)';
                setTimeout(() => {
                  if (!hiloEl) return;
                  hiloEl.style.backgroundColor = '';
                  flashes += 1;
                  if (flashes < 3) setTimeout(doFlash, 180);
                }, 220);
              };
              doFlash();
            } catch (e) { /* noop */ }
          } else {
            console.debug('[Comunidad] scrollQuery: no se encontró hilo para', hiloId);
          }
        })();
      }
    } catch (e) {
      console.warn('Error buscando hilo por scrollQuery', e);
    }
  }, [posts, location]);

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
            <PostCard key={post.id} post={post} onAddResponse={addResponse} onOpen={loadResponses} onUpdatePost={updatePost} />
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