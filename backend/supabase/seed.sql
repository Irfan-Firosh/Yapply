-- Demo company. The password is "secret" (bcrypt).
insert into company (username, email, hashed_password)
values ('yapply', 'demo@yapply.irfanfirosh.app', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW')
on conflict (username) do nothing;

select reset_demo();
