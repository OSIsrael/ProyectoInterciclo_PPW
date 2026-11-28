-- Activar las claves foráneas
PRAGMA foreign_keys = ON;

-- TABLA 1: USUARIOS
CREATE TABLE IF NOT EXISTS GRL_USUARIOS (
                                            usu_codigo INTEGER PRIMARY KEY AUTOINCREMENT,
                                            usu_nombre TEXT NOT NULL,
                                            usu_apellido TEXT NOT NULL,
                                            usu_correo TEXT NOT NULL UNIQUE,
                                            usu_username TEXT NOT NULL UNIQUE,
                                            usu_password_hash TEXT NOT NULL,
                                            usu_rol TEXT NOT NULL CHECK (usu_rol IN ('A', 'D', 'E')),
    usu_estado TEXT NOT NULL CHECK (usu_estado IN ('A', 'I')),
    usu_fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usu_codigo1 INTEGER,

    CONSTRAINT admin_usu
    FOREIGN KEY (usu_codigo1)
    REFERENCES GRL_USUARIOS(usu_codigo)
    );
-- TABLA 2: LABORATORIOS
CREATE TABLE IF NOT EXISTS GRL_LABORATORIOS (
                                                lab_codigo INTEGER PRIMARY KEY AUTOINCREMENT,
                                                lab_nombre TEXT NOT NULL,
                                                lab_ubicacion TEXT NOT NULL,
                                                lab_capacidad INTEGER NOT NULL CHECK (lab_capacidad > 0),
    lab_software_instalado TEXT NOT NULL,
    lab_foto TEXT NOT NULL,
    lab_estado TEXT NOT NULL CHECK (lab_estado IN ('D', 'M'))
    );

-- TABLA 3: EQUIPOS
CREATE TABLE IF NOT EXISTS GRL_EQUIPOS (
                                           equ_codigo INTEGER PRIMARY KEY AUTOINCREMENT,
                                           equ_codigo_inventario TEXT NOT NULL UNIQUE,
                                           equ_tipo TEXT NOT NULL,
                                           equ_estado TEXT NOT NULL CHECK (equ_estado IN ('O', 'D', 'R')),
    lab_codigo INTEGER NOT NULL,

    CONSTRAINT lab_equi
    FOREIGN KEY (lab_codigo)
    REFERENCES GRL_LABORATORIOS(lab_codigo)
    );

-- TABLA 4: HORARIOS
CREATE TABLE IF NOT EXISTS GRL_HORARIOS (
                                            hor_codigo INTEGER PRIMARY KEY AUTOINCREMENT,
                                            hor_dia_semana TEXT NOT NULL,
                                            hor_hora_inicio TEXT NOT NULL,
                                            hor_hora_fin TEXT NOT NULL,
                                            hor_activo TEXT NOT NULL CHECK (hor_activo IN ('S', 'N')),
    lab_codigo INTEGER NOT NULL,

    CONSTRAINT lab_hor
    FOREIGN KEY (lab_codigo)
    REFERENCES GRL_LABORATORIOS(lab_codigo),

    CHECK (hor_hora_inicio < hor_hora_fin)
    );
-- TABLA 5: BLOQUEOS
CREATE TABLE IF NOT EXISTS GRL_BLOQUEOS (
                                            blo_codigo INTEGER PRIMARY KEY AUTOINCREMENT,
                                            blo_tipo TEXT NOT NULL,
                                            blo_motivo TEXT NOT NULL,
                                            blo_inicio TEXT NOT NULL,
                                            blo_fin TEXT NOT NULL,
                                            lab_codigo INTEGER NOT NULL,
                                            usu_codigo INTEGER NOT NULL,

                                            CONSTRAINT lab_bloq
                                            FOREIGN KEY (lab_codigo)
    REFERENCES GRL_LABORATORIOS(lab_codigo),

    CONSTRAINT usu_bloq
    FOREIGN KEY (usu_codigo)
    REFERENCES GRL_USUARIOS(usu_codigo),

    CHECK (blo_inicio < blo_fin)
    );
-- TABLA 6: RESERVAS
CREATE TABLE IF NOT EXISTS GRL_RESERVAS (
                                            res_codigo INTEGER PRIMARY KEY AUTOINCREMENT,
                                            res_tipo TEXT NOT NULL CHECK (res_tipo IN ('L', 'E')),
    res_fecha_hora_inicio TEXT NOT NULL,
    res_fecha_hora_fin TEXT NOT NULL,
    res_asignatura TEXT,
    res_motivo TEXT,
    res_estado TEXT NOT NULL CHECK (
                                       res_estado IN ('P', 'A', 'R', 'C', 'F')
    ),
    res_mensaje_respuesta TEXT NOT NULL DEFAULT '',
    usu_codigo INTEGER NOT NULL,
    lab_codigo INTEGER NOT NULL,
    usu_codigo1 INTEGER,
    hor_codigo INTEGER NOT NULL,
    equ_codigo INTEGER,

    CONSTRAINT usu_res
    FOREIGN KEY (usu_codigo)
    REFERENCES GRL_USUARIOS(usu_codigo),

    CONSTRAINT lab_res
    FOREIGN KEY (lab_codigo)
    REFERENCES GRL_LABORATORIOS(lab_codigo),

    CONSTRAINT usu_res_admin
    FOREIGN KEY (usu_codigo1)
    REFERENCES GRL_USUARIOS(usu_codigo),

    CONSTRAINT hor_res
    FOREIGN KEY (hor_codigo)
    REFERENCES GRL_HORARIOS(hor_codigo),

    CONSTRAINT equ_res
    FOREIGN KEY (equ_codigo)
    REFERENCES GRL_EQUIPOS(equ_codigo),

    CHECK (res_fecha_hora_inicio < res_fecha_hora_fin),

    CHECK (
        (res_tipo = 'L' AND equ_codigo IS NULL)
            OR
        (res_tipo = 'E' AND equ_codigo IS NOT NULL)
    )
);
-- TABLA 7: INCIDENCIAS
CREATE TABLE IF NOT EXISTS GRL_INCIDENCIAS (
                                               inc_codigo INTEGER PRIMARY KEY AUTOINCREMENT,
                                               inc_descripcion TEXT NOT NULL,
                                               inc_prioridad TEXT NOT NULL CHECK (
                                               inc_prioridad IN ('B', 'M', 'A')
    ),
    inc_estado TEXT NOT NULL CHECK (
                                       inc_estado IN ('P', 'E', 'R')
    ),
    inc_fecha_reporte TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    inc_comentario_admin TEXT,
    usu_codigo INTEGER NOT NULL,
    equ_codigo INTEGER NOT NULL,
    usu_codigo1 INTEGER,

    CONSTRAINT usu_incidencias
    FOREIGN KEY (usu_codigo)
    REFERENCES GRL_USUARIOS(usu_codigo),

    CONSTRAINT equi_inci
    FOREIGN KEY (equ_codigo)
    REFERENCES GRL_EQUIPOS(equ_codigo),

    CONSTRAINT usu_admin_inci
    FOREIGN KEY (usu_codigo1)
    REFERENCES GRL_USUARIOS(usu_codigo)
    );
-- TABLA 8: NOTIFICACIONES
CREATE TABLE IF NOT EXISTS GRL_NOTIFICACIONES (
                                                  not_codigo INTEGER PRIMARY KEY AUTOINCREMENT,
                                                  not_tipo TEXT NOT NULL,
                                                  not_titulo TEXT NOT NULL,
                                                  not_mensaje TEXT NOT NULL,
                                                  not_fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                                  not_leida TEXT NOT NULL DEFAULT 'N' CHECK (
                                                  not_leida IN ('S', 'N')
    ),
    usu_codigo INTEGER NOT NULL,
    inc_codigo INTEGER,
    res_codigo INTEGER,

    CONSTRAINT usu_not
    FOREIGN KEY (usu_codigo)
    REFERENCES GRL_USUARIOS(usu_codigo),

    CONSTRAINT inci_not
    FOREIGN KEY (inc_codigo)
    REFERENCES GRL_INCIDENCIAS(inc_codigo),

    CONSTRAINT res_not
    FOREIGN KEY (res_codigo)
    REFERENCES GRL_RESERVAS(res_codigo)
    );