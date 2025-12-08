-- Delete existing FAQ items and insert updated, concise content
DELETE FROM public.faq_items;

-- Insert updated FAQ items with concise answers
INSERT INTO public.faq_items (question, answer, category, is_published, order_index) VALUES
-- Getting Started
('What is AYN?', 'AYN is your intelligent AI companion designed to help you with daily organization, planning, and life management.', 'getting_started', true, 1),

('How do I get started with AYN?', 'Create an account using your email, complete the quick tutorial to learn the interface, then start chatting with AYN.', 'getting_started', true, 2),

('Is AYN free to use?', 'AYN is free with limited access. For premium features and unlimited usage, contact the AYN team.', 'getting_started', true, 3),

-- Features
('Can I upload files to AYN?', 'Yes! Drag and drop PDFs, images (PNG, JPG), or text files into the chat, or use the attachment button.', 'features', true, 4),

('How does AYN remember conversations?', 'AYN saves your chat history. View past messages in the sidebar, start new chats anytime, or pin important ones for quick access.', 'features', true, 5),

-- Account & Security
('How do I change my password?', 'Go to Settings → Account Preferences → Change Password. Enter your current and new password, then click Update.', 'account', true, 6),

('Is my data secure?', 'Yes. We use end-to-end encryption, automatic session timeouts, and you control what data is stored. Your data is never shared.', 'account', true, 7),

('How do I delete my account?', 'Go to Settings → Privacy Settings → Delete Account. This action is permanent and will delete all your data.', 'account', true, 8),

-- Troubleshooting
('Why is AYN not responding?', 'Check your internet connection, refresh the page, or try a different browser. If the issue persists, submit a support ticket.', 'troubleshooting', true, 9),

('I forgot my password. How do I reset it?', 'Click Sign In → Forgot Password → Enter your email. Check your inbox for a reset link (expires in 24 hours).', 'troubleshooting', true, 10),

('My file upload failed. What should I do?', 'Ensure your file is under 10MB and in a supported format (PDF, PNG, JPG, TXT). Try compressing or converting the file.', 'troubleshooting', true, 11);