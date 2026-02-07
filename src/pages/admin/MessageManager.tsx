import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messagesAPI, ContactMessage, MessageReply } from '../../api/messages';
import { zohoEmailAPI } from '../../api/zohoEmail';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import '../../components/AdminLayout.css';
import './MessageManager.css';

const MessageManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [zohoConfigured, setZohoConfigured] = useState(false);
  const [checkingZoho, setCheckingZoho] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingCompose, setSendingCompose] = useState(false);

  useEffect(() => {
    loadMessages();
    checkZohoStatus();
  }, []);

  const checkZohoStatus = async () => {
    try {
      setCheckingZoho(true);
      const config = await zohoEmailAPI.getConfig();
      setZohoConfigured(config.configured);
    } catch (error: any) {
      console.error('Failed to check Zoho status:', error);
      setZohoConfigured(false);
    } finally {
      setCheckingZoho(false);
    }
  };

  const handleComposeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      showError('Please fill in all fields (To, Subject, and Message).');
      return;
    }

    if (!zohoConfigured) {
      showError('Zoho email is not configured. Please configure it first.');
      return;
    }

    setSendingCompose(true);
    try {
      const result = await zohoEmailAPI.sendComposedEmail(composeTo.trim(), composeSubject.trim(), composeBody.trim());
      if (result.success) {
        showSuccess(result.message || 'Email sent successfully!');
        setShowCompose(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
      } else {
        showError(result.error || 'Failed to send email.');
      }
    } catch (error: any) {
      console.error('Failed to send composed email:', error);
      showError(error.response?.data?.error || 'Failed to send email. Please try again.');
    } finally {
      setSendingCompose(false);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messagesAPI.getMessages();
      setMessages(data.results || []);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      showError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message: ContactMessage) => {
    try {
      // Load full message details with replies
      const fullMessage = await messagesAPI.getMessage(message.id);
      setSelectedMessage(fullMessage);
      // Mark as read if not already read
      if (!fullMessage.is_read) {
        await messagesAPI.markAsRead(message.id);
        // Update in the list
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, is_read: true } : m
        ));
      }
    } catch (error: any) {
      console.error('Failed to load message:', error);
      showError('Failed to load message details.');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyContent.trim()) {
      showError('Please enter a reply message.');
      return;
    }

    try {
      setSubmittingReply(true);
      const reply = await messagesAPI.createReply(selectedMessage.id, replyContent);
      showSuccess('Reply sent successfully!');
      setReplyContent('');
      // Reload message to get updated replies
      const updatedMessage = await messagesAPI.getMessage(selectedMessage.id);
      setSelectedMessage(updatedMessage);
      // Reload messages list to update read status
      loadMessages();
    } catch (error: any) {
      console.error('Failed to send reply:', error);
      showError(error.response?.data?.detail || 'Failed to send reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleMarkAsRead = async (message: ContactMessage) => {
    try {
      await messagesAPI.markAsRead(message.id);
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, is_read: true } : m
      ));
      if (selectedMessage?.id === message.id) {
        setSelectedMessage({ ...selectedMessage, is_read: true });
      }
      showSuccess('Message marked as read.');
    } catch (error: any) {
      showError('Failed to update message status.');
    }
  };

  const handleMarkAsUnread = async (message: ContactMessage) => {
    try {
      await messagesAPI.markAsUnread(message.id);
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, is_read: false } : m
      ));
      if (selectedMessage?.id === message.id) {
        setSelectedMessage({ ...selectedMessage, is_read: false });
      }
      showSuccess('Message marked as unread.');
    } catch (error: any) {
      showError('Failed to update message status.');
    }
  };

  const handleDelete = async (message: ContactMessage) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await messagesAPI.deleteMessage(message.id);
      showSuccess('Message deleted successfully.');
      setMessages(prev => prev.filter(m => m.id !== message.id));
      if (selectedMessage?.id === message.id) {
        setSelectedMessage(null);
      }
    } catch (error: any) {
      showError('Failed to delete message.');
    }
  };

  const filterMessages = (msgs: ContactMessage[]): ContactMessage[] => {
    if (!searchQuery) return msgs;
    const query = searchQuery.toLowerCase();
    return msgs.filter(msg =>
      msg.name.toLowerCase().includes(query) ||
      msg.email.toLowerCase().includes(query) ||
      msg.subject.toLowerCase().includes(query) ||
      msg.message.toLowerCase().includes(query)
    );
  };

  const filteredMessages = filterMessages(messages);
  const unreadCount = messages.filter(m => !m.is_read).length;

  if (loading) {
    return (
      <AdminLayout title="Message Manager" subtitle="Loading messages...">
        <div className="message-manager">
          <div className="admin-loading">Loading messages...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Message Manager" 
      subtitle={`Manage contact form submissions and replies${unreadCount > 0 ? ` • ${unreadCount} unread` : ''}`}
    >
      <div className="message-manager">
        {/* Zoho Email Status Section */}
        <div className="zoho-email-status" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#111827' }}>Zoho Email Configuration</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                {zohoConfigured 
                  ? '✓ Zoho email is configured. Replies will be sent via Zoho SMTP.'
                  : 'Zoho email is not configured. Configure it to send reply emails.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => navigate('/admin/zoho-email')}
                className="action-btn"
                style={{ background: '#2563eb', color: 'white', border: 'none' }}
              >
                {zohoConfigured ? 'Configure Zoho' : 'Setup Zoho Email'}
              </button>
              <button
                onClick={checkZohoStatus}
                disabled={checkingZoho}
                className="action-btn"
              >
                {checkingZoho ? 'Checking...' : 'Refresh Status'}
              </button>
            </div>
          </div>
        </div>

        {/* Compose Email Modal */}
        {showCompose && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '2rem',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Compose Email</h2>
                <button
                  onClick={() => {
                    setShowCompose(false);
                    setComposeTo('');
                    setComposeSubject('');
                    setComposeBody('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0.25rem 0.5rem',
                  }}
                >
                  ×
                </button>
              </div>

              {!zohoConfigured && (
                <div style={{
                  padding: '1rem',
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '0.375rem',
                  marginBottom: '1.5rem',
                  color: '#991b1b',
                }}>
                  <strong>Zoho email is not configured.</strong> Please configure Zoho email first to send messages.
                </div>
              )}

              <form onSubmit={handleComposeEmail}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="compose-to" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    To *
                  </label>
                  <input
                    type="email"
                    id="compose-to"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="recipient@example.com"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="compose-subject" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="compose-subject"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="Email subject"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="compose-body" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Message *
                  </label>
                  <textarea
                    id="compose-body"
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Type your message here..."
                    required
                    rows={10}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompose(false);
                      setComposeTo('');
                      setComposeSubject('');
                      setComposeBody('');
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingCompose || !zohoConfigured}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: sendingCompose || !zohoConfigured ? '#9ca3af' : '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '1rem',
                      fontWeight: 500,
                      cursor: sendingCompose || !zohoConfigured ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {sendingCompose ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="message-layout">
          <div className="message-list-panel">
            <div className="message-list-header">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                <div className="search-container" style={{ flex: 1 }}>
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                </div>
                <button
                  onClick={() => setShowCompose(true)}
                  disabled={!zohoConfigured}
                  style={{
                    padding: '0.5rem 1rem',
                    background: zohoConfigured ? '#2563eb' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: zohoConfigured ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                  }}
                  title={!zohoConfigured ? 'Configure Zoho email first' : 'Compose new email'}
                >
                  + Compose
                </button>
              </div>
            </div>
            <div className="message-list">
              {filteredMessages.length === 0 ? (
                <div className="empty-state">No messages found</div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-item ${!message.is_read ? 'unread' : ''} ${
                      selectedMessage?.id === message.id ? 'selected' : ''
                    }`}
                    onClick={() => handleViewMessage(message)}
                  >
                    <div className="message-item-header">
                      <span className="message-sender">{message.name}</span>
                      <span className="message-date">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="message-subject">{message.subject}</div>
                    <div className="message-preview">{message.message.substring(0, 100)}...</div>
                    {!message.is_read && <span className="unread-indicator"></span>}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="message-detail-panel">
            {selectedMessage ? (
              <div className="message-detail">
                <div className="message-detail-header">
                  <div>
                    <h2>{selectedMessage.subject}</h2>
                    <div className="message-meta">
                      <span><strong>From:</strong> {selectedMessage.name} ({selectedMessage.email})</span>
                      <span><strong>Date:</strong> {new Date(selectedMessage.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="message-actions">
                    {selectedMessage.is_read ? (
                      <button
                        className="action-btn"
                        onClick={() => handleMarkAsUnread(selectedMessage)}
                      >
                        Mark as Unread
                      </button>
                    ) : (
                      <button
                        className="action-btn"
                        onClick={() => handleMarkAsRead(selectedMessage)}
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(selectedMessage)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="message-content">
                  <h3>Message:</h3>
                  <div className="message-text">{selectedMessage.message}</div>
                </div>

                {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                  <div className="replies-section">
                    <h3>Replies ({selectedMessage.replies.length})</h3>
                    {selectedMessage.replies.map((reply) => (
                      <div key={reply.id} className="reply-item">
                        <div className="reply-header">
                          <span className="reply-author">
                            {reply.replied_by_name || 'Admin'}
                          </span>
                          <span className="reply-date">
                            {new Date(reply.created_at).toLocaleString()}
                          </span>
                          {reply.email_sent ? (
                            <span className="email-status sent">
                              ✓ Email sent
                            </span>
                          ) : reply.email_error ? (
                            <span className="email-status failed">
                              ✗ Failed: {reply.email_error}
                            </span>
                          ) : (
                            <span className="email-status pending">
                              Email pending
                            </span>
                          )}
                        </div>
                        <div className="reply-content">{reply.reply_content}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="reply-section">
                  <h3>Reply</h3>
                  <form onSubmit={handleReply}>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply here..."
                      rows={6}
                      required
                      className="reply-textarea"
                    />
                    <button
                      type="submit"
                      className="submit-reply-btn"
                      disabled={submittingReply}
                    >
                      {submittingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <p>Select a message to view details and reply</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MessageManager;

