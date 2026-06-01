CREATE TABLE `gastosProxy` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`descricao` text,
	`data` date NOT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gastosProxy_id` PRIMARY KEY(`id`)
);
