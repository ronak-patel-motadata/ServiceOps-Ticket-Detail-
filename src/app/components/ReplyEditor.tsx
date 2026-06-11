import { X, Maximize2, Sparkles, ChevronDown, ChevronRight, Paperclip, Image as ImageIcon, Link2, Smile, Type, Bold, Italic, Underline, List, ListOrdered, Code, CheckCircle, FileText, Mail, XCircle, RefreshCw, TextCursorInput, Minimize2, Wand2, Briefcase, Heart, Zap, SmilePlus, Plus } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

interface ReplyEditorProps {
  replyFormRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onSend: () => void;
  showCc: boolean;
  setShowCc: (value: boolean) => void;
  isAiTyping: boolean;
  aiTypingText: string;
  setAiTypingText: (value: string) => void;
  replyContent: string;
  setReplyContent: (value: string) => void;
  replyContentRef: React.RefObject<HTMLDivElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  setShowAIAssist: (value: boolean) => void;
  showAIAssistMenu: boolean;
  setShowAIAssistMenu: (value: boolean) => void;
  aiAssistMenuRef: React.RefObject<HTMLDivElement>;
  handleReplyWithAI: (type: string) => void;
  showToneSubmenu: boolean;
  setShowToneSubmenu: (value: boolean) => void;
  showFormattingMenu: boolean;
  setShowFormattingMenu: (value: boolean) => void;
  formattingMenuRef: React.RefObject<HTMLDivElement>;
  requesterEmail?: string;
  showKbArticles: boolean;
  kbArticles: Array<{
    id: string;
    title: string;
    url: string;
  }>;
  setKbArticles: (articles: Array<{
    id: string;
    title: string;
    url: string;
  }>) => void;
}

export function ReplyEditor({
  replyFormRef,
  onClose,
  onSend,
  showCc,
  setShowCc,
  isAiTyping,
  aiTypingText,
  setAiTypingText,
  replyContent,
  setReplyContent,
  replyContentRef,
  textareaRef,
  setShowAIAssist,
  showAIAssistMenu,
  setShowAIAssistMenu,
  aiAssistMenuRef,
  handleReplyWithAI,
  showToneSubmenu,
  setShowToneSubmenu,
  showFormattingMenu,
  setShowFormattingMenu,
  formattingMenuRef,
  requesterEmail,
  showKbArticles,
  kbArticles,
  setKbArticles
}: ReplyEditorProps) {
  const [showAddKbForm, setShowAddKbForm] = useState(false);
  const [newKbId, setNewKbId] = useState('');
  const [newKbTitle, setNewKbTitle] = useState('');
  const [newKbUrl, setNewKbUrl] = useState('');

  const handleAddKbArticle = () => {
    if (newKbId.trim() && newKbTitle.trim() && newKbUrl.trim()) {
      setKbArticles([...kbArticles, {
        id: newKbId.trim(),
        title: newKbTitle.trim(),
        url: newKbUrl.trim()
      }]);
      setNewKbId('');
      setNewKbTitle('');
      setNewKbUrl('');
      setShowAddKbForm(false);
    }
  };

  return (
    <div 
      className="mt-4 mb-3 border-2 border-[#3D8BD0] rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer" 
      ref={replyFormRef}
      onClick={onClose}
    >
      {/* Reply Header */}
      <div className="bg-[#F9FAFB] px-4 py-3 border-b border-[#DFE5ED] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-[#364658]">Reply</h3>
        <div className="flex items-center gap-2">
          <button className="text-[#7B8FA5] hover:text-[#364658]">
            <Maximize2 size={16} />
          </button>
          <button className="text-[#7B8FA5] hover:text-[#364658]" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Reply Form Content */}
      <div className="p-4" onClick={(e) => e.stopPropagation()}>
        {/* To Field */}
        <div className="pb-3 border-b border-[#DFE5ED]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-[#7B8FA5]">To</label>
              <input
                type="text"
                className="flex-1 text-sm text-[#364658] focus:outline-none bg-transparent"
                defaultValue="arnav.desai@motadata.com"
              />
            </div>
            <button 
              onClick={() => setShowCc(!showCc)}
              className="text-xs text-[#7B8FA5] hover:text-[#3D8BD0]"
            >
              Cc
            </button>
          </div>
        </div>

        {/* Cc Field */}
        {showCc && (
          <div className="pt-3 pb-3 border-b border-[#DFE5ED]">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#7B8FA5]">Cc</label>
              <input
                type="text"
                placeholder="Add recipients"
                className="flex-1 text-sm text-[#364658] focus:outline-none bg-transparent"
              />
            </div>
          </div>
        )}

        {/* Text Area */}
        <div className="mb-4 mt-4 relative">
          {isAiTyping && aiTypingText === '' && !replyContent && (
            <div className="absolute top-4 left-2 flex items-center gap-2 text-[#3D8BD0] animate-in fade-in duration-300">
              <Sparkles size={16} className="animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-[#3D8BD0] via-[#6CE5E8] to-[#3D8BD0] bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite] bg-clip-text text-transparent">
                AI is thinking
              </span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#3D8BD0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#3D8BD0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#3D8BD0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          )}
          {replyContent ? (
            <div
              ref={replyContentRef}
              contentEditable
              dir="ltr"
              onInput={(e) => setReplyContent(e.currentTarget.innerHTML)}
              className="w-full min-h-[256px] text-sm text-[#364658] focus:outline-none bg-transparent"
              style={{
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={aiTypingText}
              onChange={(e) => setAiTypingText(e.target.value)}
              placeholder="Press Space to reply using AI assist or Start Typing..."
              className={`w-full ${showKbArticles ? 'h-32' : 'h-64'} text-sm text-[#364658] focus:outline-none bg-transparent resize-none`}
              dir="ltr"
              onKeyDown={(e) => {
                if (e.key === ' ' && textareaRef.current?.value === '') {
                  e.preventDefault();
                  setShowAIAssist(true);
                }
              }}
            />
          )}
        </div>

        {/* KB Articles Section */}
        {showKbArticles && aiTypingText && (
          <div className="mb-4 p-3 bg-[#F0F8FF] border border-[#B8DCFF] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-[#3D8BD0]">Suggested KB Articles</h4>
              {!showAddKbForm && (
                <button
                  onClick={() => setShowAddKbForm(true)}
                  className="flex items-center gap-1 text-xs text-[#3D8BD0] hover:text-[#2E6BA4] font-medium hidden"
                  title="Add KB article"
                >
                  <Plus size={12} />
                  Add
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {kbArticles.map((article) => (
                <div key={article.id} className="flex items-center gap-2 group">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#3D8BD0] hover:text-[#2E6BA4] hover:underline flex-1"
                  >
                    <FileText size={12} className="flex-shrink-0" />
                    <span>{article.title}</span>
                  </a>
                  <button
                    onClick={() => {
                      setKbArticles(kbArticles.filter(kb => kb.id !== article.id));
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#B8DCFF] rounded"
                    title="Remove KB article"
                  >
                    <XCircle size={14} className="text-[#3D8BD0]" />
                  </button>
                </div>
              ))}
              {showAddKbForm && (
                <div className="mt-2 p-2 bg-white border border-[#B8DCFF] rounded space-y-2">
                  <input
                    type="text"
                    placeholder="KB ID (e.g., KB-1234)"
                    value={newKbId}
                    onChange={(e) => setNewKbId(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-[#DFE5ED] rounded focus:outline-none focus:border-[#3D8BD0]"
                  />
                  <input
                    type="text"
                    placeholder="Title (e.g., KB-1234: Troubleshooting Guide)"
                    value={newKbTitle}
                    onChange={(e) => setNewKbTitle(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-[#DFE5ED] rounded focus:outline-none focus:border-[#3D8BD0]"
                  />
                  <input
                    type="text"
                    placeholder="URL (e.g., https://kb.motadata.com/article/1234)"
                    value={newKbUrl}
                    onChange={(e) => setNewKbUrl(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-[#DFE5ED] rounded focus:outline-none focus:border-[#3D8BD0]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddKbArticle}
                      className="flex-1 px-2 py-1 text-xs bg-[#3D8BD0] text-white rounded hover:bg-[#2E6BA4]"
                    >
                      Add Article
                    </button>
                    <button
                      onClick={() => {
                        setShowAddKbForm(false);
                        setNewKbId('');
                        setNewKbTitle('');
                        setNewKbUrl('');
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-[#F3F4F6] text-[#364658] rounded hover:bg-[#E5E7EB]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between relative">
          {/* Left Side - AI Assist and Formatting Tools */}
          <div className="flex items-center gap-1">
            {/* AI Assist Button with Dropdown */}
            <div className="relative" ref={aiAssistMenuRef}>
              <button 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-[#F0F8FF] text-xs font-medium text-[#364658]"
                style={{ background: 'linear-gradient(125deg, rgba(61, 139, 208, 0.12) 9.82%, rgba(108, 229, 232, 0.12) 73.33%, rgba(28, 229, 177, 0.12) 136.84%)' }}
                onClick={() => setShowAIAssistMenu(!showAIAssistMenu)}
              >
                <Sparkles size={14} className="text-[#3D8BD0]" />
                <span>AI Assist</span>
                <ChevronDown size={12} className="text-[#7B8FA5]" />
              </button>

              {/* AI Assist Dropdown - Reply Editor */}
              {showAIAssistMenu && (
                <div className="absolute left-0 bottom-full mb-2 w-[240px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    {/* Generate a reply section */}
                    <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">
                      Generate a reply
                    </div>
                    
                    {/* Acknowledge */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => {
                        setShowAIAssistMenu(false);
                        handleReplyWithAI('Acknowledge');
                      }}
                    >
                      <CheckCircle size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Acknowledge</span>
                    </button>
                    
                    {/* Request Additional Details */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => {
                        setShowAIAssistMenu(false);
                        handleReplyWithAI('Request Additional Details');
                      }}
                    >
                      <FileText size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Request Additional Details</span>
                    </button>
                    
                    {/* Follow up */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => {
                        setShowAIAssistMenu(false);
                        handleReplyWithAI('Follow up');
                      }}
                    >
                      <Mail size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Follow up</span>
                    </button>
                    
                    {/* Request Closure Confirmation */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => {
                        setShowAIAssistMenu(false);
                        handleReplyWithAI('Request Closure\nConfirmation');
                      }}
                    >
                      <XCircle size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Request Closure Confirmation</span>
                    </button>

                    {/* Divider */}
                    <div className="my-2 border-t border-[#DFE5ED]"></div>

                    {/* Refine section */}
                    <div className="px-2 py-1.5 text-[11px] font-medium text-[#7B8FA5]">
                      Refine
                    </div>
                    
                    {/* Rephrase */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => setShowAIAssistMenu(false)}
                    >
                      <RefreshCw size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Rephrase</span>
                    </button>
                    
                    {/* Make longer */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => setShowAIAssistMenu(false)}
                    >
                      <TextCursorInput size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Make longer</span>
                    </button>
                    
                    {/* Make shorter */}
                    <button 
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                      onClick={() => setShowAIAssistMenu(false)}
                    >
                      <Minimize2 size={14} className="text-[#364658]" />
                      <span className="text-xs text-[#364658]">Make shorter</span>
                    </button>
                    
                    {/* Change tone - with submenu */}
                    <div className="relative">
                      <button 
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left justify-between"
                        onClick={() => setShowToneSubmenu(!showToneSubmenu)}
                      >
                        <div className="flex items-center gap-2">
                          <Wand2 size={14} className="text-[#364658]" />
                          <span className="text-xs text-[#364658]">Change tone</span>
                        </div>
                        <ChevronRight size={14} className="text-[#7B8FA5]" />
                      </button>

                      {/* Tone Submenu */}
                      {showToneSubmenu && (
                        <div className="absolute left-full bottom-0 ml-1 w-[160px] bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50">
                          <div className="py-2">
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => {
                                setShowToneSubmenu(false);
                                setShowAIAssistMenu(false);
                              }}
                            >
                              <Briefcase size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Professional</span>
                            </button>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => {
                                setShowToneSubmenu(false);
                                setShowAIAssistMenu(false);
                              }}
                            >
                              <Heart size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Empathetic</span>
                            </button>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => {
                                setShowToneSubmenu(false);
                                setShowAIAssistMenu(false);
                              }}
                            >
                              <Zap size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Concise</span>
                            </button>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => {
                                setShowToneSubmenu(false);
                                setShowAIAssistMenu(false);
                              }}
                            >
                              <FileText size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Formal</span>
                            </button>
                            
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#F9FAFB] transition-colors text-left"
                              onClick={() => {
                                setShowToneSubmenu(false);
                                setShowAIAssistMenu(false);
                              }}
                            >
                              <SmilePlus size={14} className="text-[#364658]" />
                              <span className="text-xs text-[#364658]">Friendly</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Formatting Tools */}
            <div className="relative flex items-center gap-1" ref={formattingMenuRef}>
              {/* Always visible quick access icons */}
              <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Attach File">
                <Paperclip size={16} />
              </button>
              <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Insert Image">
                <ImageIcon size={16} />
              </button>
              <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Insert Link">
                <Link2 size={16} />
              </button>
              <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Insert Emoji">
                <Smile size={16} />
              </button>
              
              {/* Type button to show all formatting options */}
              <button 
                className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]"
                onClick={() => setShowFormattingMenu(!showFormattingMenu)}
              >
                <Type size={16} />
              </button>

              {/* All Formatting Options Dropdown */}
              {showFormattingMenu && (
                <div className="absolute left-0 bottom-full mb-2 bg-white border border-[#DFE5ED] rounded-lg shadow-lg z-50 px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Bold">
                      <Bold size={16} />
                    </button>
                    <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Italic">
                      <Italic size={16} />
                    </button>
                    <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Underline">
                      <Underline size={16} />
                    </button>
                    <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Bulleted List">
                      <List size={16} />
                    </button>
                    <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Numbered List">
                      <ListOrdered size={16} />
                    </button>
                    <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Code">
                      <Code size={16} />
                    </button>
                    <button className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" title="Link">
                      <Link2 size={16} />
                    </button>
                    <button 
                      className="size-[30px] flex items-center justify-center hover:bg-[#F9FAFB] rounded text-[#7B8FA5]" 
                      title="Close"
                      onClick={() => setShowFormattingMenu(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Send Button */}
          <button 
            className="px-4 py-1.5 bg-[#3D8BD0] text-white rounded-lg hover:bg-[#2F7AB8] text-xs font-medium"
            onClick={() => {
              console.log('Send button clicked');
              onSend();
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}