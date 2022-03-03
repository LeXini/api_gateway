-- Criar a tabela produtos

create table usuario (
nome varchar(50) not null, 
senha varchar(50) not null);

-- inserir alguns registros
insert into usuario (nome, senha) values ('marcos', 'senha123'), ('cesar', 'outrasenha');
