DROP TABLE IF EXISTS dbo.clientes;
/*----------------------------------------------------------------------------------------*/
CREATE TABLE dbo.personal_ref (
    id_cliente INT PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    correo_electronico VARCHAR(100) NOT NULL,
);

CREATE TABLE dbo.lineas_proyecto(
    id_linea INT PRIMARY KEY,
    nombre_linea VARCHAR(100) NOT NULL,
    descripcion TEXT
  );

CREATE TABLE dbo.proyectos_ref (
    id_proyecto INT PRIMARY KEY,
    nombre_proyecto VARCHAR(100) NOT NULL,
    linea_proyecto INT NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE

    FOREIGN KEY (linea_proyecto) REFERENCES dbo.lineas_proyecto(id_linea)
);

CREATE TABLE dbo.rol (
    id_rol INT PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL
);

/*----------------------------------------------------------------------------------------*/
INSERT INTO dbo.personal_ref (
    id_cliente,
    nombre_personal,
    correo_electronico,
)
SELECT 
    id_cliente,
    nombre,
    correo_electronico,
    'BDPersonal'
FROM BDIngetec.dbo.Personal; /* Suponiendo que la tabla de personal en BDIngetec se llama "Personal" */

INSERT INTO dbo.proyectos_ref (
    id_proyecto,
    nombre_proyecto,
    descripcion,
    fecha_inicio,
    fecha_fin
)SELECT 
    id_proyecto,
    nombre_proyecto,
    descripcion,
    fecha_inicio,
    fecha_fin,
    'BDProyectos'
FROM BDIngetec.dbo.proyectos; /* Suponiendo que la tabla de proyectos en BDIngetec se llama "proyectos" */
/*----------------------------------------------------------------------------------------*/
CREATE TABLE dbo.personal_proyecto (
    id_pesonal INT NOT NULL,
    id_rol VARCHAR(50) NOT NULL,
    id_proyecto VARCHAR(100) NOT NULL,

    CONSTRAINT PK_personal PRIMARY KEY (id_pesonal, id_rol, id_proyecto),
    CONSTRAINT FK_id_personal FOREIGN KEY (id_pesonal) REFERENCES dbo.empleados(id_empleado),
    CONTRAINT FK_id_rol FOREIGN KEY (id_rol) REFERENCES dbo.rol(nombre_rol),
    CONTRATINT FK_id_proyecto FOREIGN KEY (id_proyecto) REFERENCES dbo.proyectos(nombre_proyecto), // Asumiendo 

);

