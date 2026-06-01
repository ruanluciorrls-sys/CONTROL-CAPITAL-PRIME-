CREATE TABLE `contas` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`usuario` text NOT NULL,
	`senha` text NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`status` enum('sacado','sacando','bloqueado') NOT NULL DEFAULT 'sacando',
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contas_id` PRIMARY KEY(`id`)
);
