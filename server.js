const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();

/* =========================
   ⚙️ CONFIGURACIÓN BASE
========================= */

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get("/modulos", (req,res)=>{res.sendFile(__dirname + "/public/modulos.html");

});
/* =========================
   🏠 PÁGINA PRINCIPAL
========================= */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================
   📄 VISTAS
========================= */

app.get("/diagnostico", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "diagnostico.html"));
});

app.get("/recuperacion", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "recuperacion.html"));
});

app.get("/historial", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "historial.html"
        )
    );

});
/* =========================
   👤 COLEGIOS POR ASESOR
========================= */

app.get("/colegios/:id", async (req, res) => {

    try {

        const asesorId = req.params.id;

        const [rows] = await db.query(`
            SELECT
                id,
                nombre,
                url
            FROM colegios
            WHERE asesor_id = ?
            ORDER BY nombre
        `, [asesorId]);

        res.json(rows);
            
    } catch (err) {

        console.error(err);

        res.status(500).json({
            ok: false,
            error: "Error obteniendo colegios"
        });

    }

});

/* =========================
   📊 GUARDAR DIAGNÓSTICO
========================= */

app.post("/diagnostico", async (req, res) => {

    try {

        const {
            colegio,
            asesor,
            fecha,
            total,
            porcentaje,
            nivel,
            detalles
        } = req.body;

        const [result] = await db.query(`
            INSERT INTO diagnosticos
            (
                colegio_id,
                asesor_id,
                fecha,
                total_puntaje,
                porcentaje,
                nivel
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            colegio,
            asesor,
            fecha,
            total,
            parseFloat(
                String(porcentaje).replace("%","")
            ),
            nivel
        ]);

        const diagnosticoId = result.insertId;

        for(const item of detalles){

            await db.query(`
                INSERT INTO diagnostico_detalle
                (
                    diagnostico_id,
                    criterio_id,
                    calificacion,
                    puntaje
                )
                VALUES (?, ?, ?, ?)
            `, [
                diagnosticoId,
                item.criterio_id,
                item.calificacion,
                item.puntaje
            ]);

        }

        res.json({
            ok:true,
            diagnostico_id:diagnosticoId
        });

    } catch(err){

        console.error(err);

        res.status(500).json({
            ok:false,
            error:"Error guardando diagnóstico"
        });

    }

});

/* =========================
   🚀 GUARDAR PLAN
========================= */

app.post("/induccion", async (req, res) => {

    try {

        const {
            colegio,
            asesor,
            induccion1,
            induccion2,
            induccion3,
            induccion4
        } = req.body;

        const promedio =
            (Number(induccion1) +
             Number(induccion2) +
             Number(induccion3) +
             Number(induccion4)) / 4;

        const [result] = await db.query(`
            INSERT INTO planes_recuperacion
            (
                colegio_id,
                asesor_id,
                porcentaje_general
            )
            VALUES (?, ?, ?)
        `, [
            colegio,
            asesor,
            promedio
        ]);

        res.json({
            ok: true,
            plan_id: result.insertId
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            ok: false,
            error: "Error guardando plan"
        });

    }

});

/* =========================
   📈 PROGRESO COLEGIO
========================= */

app.get("/progreso/:id", async (req, res) => {

    try {

        const colegioId = req.params.id;

        const [rows] = await db.query(`
            SELECT
                id,
                porcentaje_general
            FROM planes_recuperacion
            WHERE colegio_id = ?
            ORDER BY id DESC
            LIMIT 1
        `, [colegioId]);

        if (rows.length === 0) {

            return res.json({
                colegio_id: colegioId,
                porcentaje: 0
            });

        }

        res.json({
            colegio_id: colegioId,
            porcentaje: rows[0].porcentaje_general
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            ok: false,
            error: "Error obteniendo progreso"
        });

    }

});

/* =========================
   ❤️ TEST MYSQL
========================= */

app.get("/test-db", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT COUNT(*) AS total
            FROM colegios
        `);

        res.json({
            ok: true,
            colegios: rows[0].total
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            ok: false,
            error: err.message
        });

    }

});



/* =========================
   👤 LISTAR ASESORES
========================= */

app.get("/asesores", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT id,nombre
            FROM asesores
            ORDER BY nombre
        `);

        res.json(rows);

    } catch (error) {

        console.error(error);
        res.status(500).json({ error: error.message });

    }

});

/* =========================
   📊 ÚLTIMO DIAGNÓSTICO
========================= */

app.get("/diagnostico/colegio/:id", async (req, res) => {

    try {

        const colegioId = req.params.id;

        const [diag] = await db.query(`
            SELECT *
            FROM diagnosticos
            WHERE colegio_id = ?
            ORDER BY fecha_creacion DESC
            LIMIT 1
        `, [colegioId]);

        if (diag.length === 0) {

            return res.json({
                existe: false
            });

        }

        const diagnostico = diag[0];

        const [detalles] = await db.query(`
            SELECT
                criterio_id,
                calificacion,
                puntaje
            FROM diagnostico_detalle
            WHERE diagnostico_id = ?
            ORDER BY criterio_id
        `, [diagnostico.id]);

        res.json({
            existe: true,
            diagnostico,
            detalles
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            ok: false,
            error: err.message
        });

    }

});

app.get(
    "/diagnosticos/colegio/:id",
    async (req, res) => {

        try {

            const colegioId =
                req.params.id;

            const [rows] =
                await db.query(`
                    SELECT
                        id,
                        fecha,
                        porcentaje,
                        nivel
                    FROM diagnosticos
                    WHERE colegio_id = ?
                    ORDER BY fecha DESC
                `,
                [colegioId]);

            res.json(rows);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                ok:false
            });

        }

});

//Endpoint para obtener un diagnóstico completo
app.get(
    "/diagnostico/:id",
    async (req, res) => {

        try {

            const diagnosticoId =
                req.params.id;

            const [rows] =
                await db.query(`
                    SELECT
                        dd.criterio_id,
                        cd.modulo,
                        cd.descripcion,
                        dd.calificacion,
                        dd.puntaje
                    FROM diagnostico_detalle dd

                    INNER JOIN criterios_diagnostico cd
                        ON cd.id = dd.criterio_id

                    WHERE dd.diagnostico_id = ?

                    ORDER BY dd.criterio_id
                `,
                [diagnosticoId]);

            res.json(rows);

        } catch (err) {

            console.error(err);

            res.status(500).json({
                ok:false
            });

        }

});

app.get(
    "/diagnostico/:id/detalle",
    async (req,res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                cd.modulo,
                cd.descripcion,
                dd.calificacion,
                dd.puntaje
            FROM diagnostico_detalle dd

            JOIN criterios_diagnostico cd
                ON cd.id = dd.criterio_id

            WHERE dd.diagnostico_id = ?

            ORDER BY dd.criterio_id
        `,
        [req.params.id]);

        res.json(rows);

    } catch(err){

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

app.get(
"/comparar/:actual/:anterior",
async (req,res)=>{

    try {

        const actual =
            req.params.actual;

        const anterior =
            req.params.anterior;

        const [rows] = await db.query(`
            SELECT

                c.descripcion,

                a.calificacion AS antes,

                b.calificacion AS despues,

                (
                    CASE b.calificacion
                        WHEN 'C' THEN 0
                        WHEN 'B' THEN 2
                        WHEN 'A' THEN 3
                        WHEN 'AD' THEN 4
                    END

                    -

                    CASE a.calificacion
                        WHEN 'C' THEN 0
                        WHEN 'B' THEN 2
                        WHEN 'A' THEN 3
                        WHEN 'AD' THEN 4
                    END

                ) AS impacto

            FROM diagnostico_detalle a

            JOIN diagnostico_detalle b

                ON a.criterio_id =
                   b.criterio_id

            JOIN criterios_diagnostico c

                ON c.id =
                   a.criterio_id

            WHERE

                a.diagnostico_id = ?
                AND
                b.diagnostico_id = ?

                AND

                a.calificacion <>
                b.calificacion
        `,
        [
            anterior,
            actual
        ]);

        res.json(rows);

    } catch(err){

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});


app.get(
"/diagnostico-anterior/:id",
async (req,res)=>{

    try {

        const diagnosticoId =
            req.params.id;

        const [[actual]] =
            await db.query(`
                SELECT
                    id,
                    colegio_id
                FROM diagnosticos
                WHERE id = ?
            `,
            [diagnosticoId]);

        if(!actual){
            return res.json(null);
        }

        const [rows] =
            await db.query(`
                SELECT id
                FROM diagnosticos
                WHERE
                    colegio_id = ?
                    AND id < ?
                ORDER BY id DESC
                LIMIT 1
            `,
            [
                actual.colegio_id,
                diagnosticoId
            ]);

        if(rows.length === 0){

            return res.json(null);

        }

        res.json(rows[0]);

    } catch(err){

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

app.get(
"/historico/:colegio",
async (req,res)=>{

    try{

        const colegio =
            req.params.colegio;

        const [rows] =
            await db.query(`
                SELECT

                    id,
                    fecha,
                    porcentaje

                FROM diagnosticos

                WHERE colegio_id = ?

                ORDER BY fecha
            `,
            [colegio]);

        res.json(rows);

    }catch(err){

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

app.get(
"/plan/:colegioId",
async (req,res)=>{

    try {

        const colegioId =
            req.params.colegioId;

        const [rows] =
            await db.query(`
                SELECT
                    pi.id,
                    pi.numero_induccion,
                    pi.porcentaje,
                    pi.fecha_revision
                FROM plan_inducciones pi

                JOIN planes_recuperacion pr
                    ON pr.id = pi.plan_id

                WHERE pr.colegio_id = ?

                ORDER BY
                    pi.numero_induccion
            `,
            [colegioId]);

        res.json(rows);

    } catch(err){

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});


// Cargar tareas guardadas de un plan
app.get("/plan/:planId/tareas", async (req, res) => {

    try {

        const planId = req.params.planId;

        const [rows] = await db.query(`
            SELECT
                tarea_id,
                completado,
                fecha_actualizacion
            FROM plan_tareas
            WHERE plan_id = ?
        `, [planId]);

        res.json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

// Guardar avance de tareas de un plan
app.post("/plan/:planId/tareas", async (req, res) => {

    try {

        const planId = req.params.planId;
        const { tareas } = req.body;

        for (const t of tareas) {

            await db.query(`
                INSERT INTO plan_tareas
                (
                    plan_id,
                    tarea_id,
                    completado
                )
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    completado = VALUES(completado)
            `, [
                planId,
                t.tarea_id,
                t.completado ? 1 : 0
            ]);

        }

        const [[avance]] = await db.query(`
            SELECT
                ROUND(
                    (
                        SUM(
                            CASE
                                WHEN completado = 1
                                THEN 1
                                ELSE 0
                            END
                        ) / COUNT(*)
                    ) * 100,
                    2
                ) AS porcentaje
            FROM plan_tareas
            WHERE plan_id = ?
        `, [planId]);

        await db.query(`
            UPDATE planes_recuperacion
            SET porcentaje_general = ?
            WHERE id = ?
        `, [
            avance.porcentaje || 0,
            planId
        ]);

        res.json({
            ok: true,
            porcentaje_general: avance.porcentaje || 0
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});


app.get("/plan/:planId/resumen-inducciones", async (req, res) => {

    try {

        const planId =
            req.params.planId;

        const [rows] =
            await db.query(`
                SELECT
                    i.id AS induccion_id,
                    i.nombre,

                    COUNT(t.id) AS total,

                    SUM(
                        CASE
                            WHEN pt.completado = 1
                            THEN 1
                            ELSE 0
                        END
                    ) AS completadas,

                    ROUND(
                        (
                            SUM(
                                CASE
                                    WHEN pt.completado = 1
                                    THEN 1
                                    ELSE 0
                                END
                            ) / COUNT(t.id)
                        ) * 100,
                        0
                    ) AS porcentaje,

                    MAX(pt.fecha_actualizacion)
                        AS ultima_actualizacion

                FROM inducciones i

                LEFT JOIN tareas_induccion t
                    ON t.induccion_id = i.id

                LEFT JOIN plan_tareas pt
                    ON pt.tarea_id = t.id
                    AND pt.plan_id = ?

                GROUP BY
                    i.id,
                    i.nombre

                ORDER BY
                    i.id
            `, [planId]);

        res.json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});


app.get("/plan/:planId/induccion/:induccionId/evidencia", async (req, res) => {

    try {

        const { planId, induccionId } = req.params;

        const [rows] = await db.query(`
            SELECT *
            FROM evidencias_induccion
            WHERE plan_id = ?
            AND induccion_id = ?
            ORDER BY id DESC
            LIMIT 1
        `, [
            planId,
            induccionId
        ]);

        if (rows.length === 0) {
            return res.json(null);
        }

        res.json(rows[0]);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});


app.post("/plan/:planId/induccion/:induccionId/evidencia", async (req, res) => {

    try {

        const { planId, induccionId } = req.params;

        const {
            responsable,
            helpdesk,
            captura_url,
            grabacion_url,
            acuerdos,
            proxima_accion,
            proxima_fecha
        } = req.body;

        const [existente] = await db.query(`
            SELECT id
            FROM evidencias_induccion
            WHERE plan_id = ?
            AND induccion_id = ?
            LIMIT 1
        `, [
            planId,
            induccionId
        ]);

        if (existente.length > 0) {

            await db.query(`
                UPDATE evidencias_induccion
                SET
                    responsable = ?,
                    helpdesk = ?,
                    captura_url = ?,
                    grabacion_url = ?,
                    acuerdos = ?,
                    proxima_accion = ?,
                    proxima_fecha = ?
                WHERE id = ?
            `, [
                responsable,
                helpdesk,
                captura_url,
                grabacion_url,
                acuerdos,
                proxima_accion,
                proxima_fecha,
                existente[0].id
            ]);

        } else {

            await db.query(`
                INSERT INTO evidencias_induccion
                (
                    plan_id,
                    induccion_id,
                    responsable,
                    helpdesk,
                    captura_url,
                    grabacion_url,
                    acuerdos,
                    proxima_accion,
                    proxima_fecha
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                planId,
                induccionId,
                responsable,
                helpdesk,
                captura_url,
                grabacion_url,
                acuerdos,
                proxima_accion,
                proxima_fecha
            ]);

        }

        res.json({
            ok: true
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});



// Obtener o crear plan de recuperación
app.get(
"/plan/:colegioId/:asesorId",
async (req,res)=>{

    try{

        const colegioId =
            req.params.colegioId;

        const asesorId =
            req.params.asesorId;

        const [plan] =
            await db.query(`
                SELECT *
                FROM planes_recuperacion
                WHERE colegio_id = ?
                ORDER BY id DESC
                LIMIT 1
            `,
            [colegioId]);

        if(plan.length){

            return res.json(plan[0]);

        }

        const [nuevo] =
            await db.query(`
                INSERT INTO
                planes_recuperacion
                (
                    colegio_id,
                    asesor_id
                )
                VALUES (?,?)
            `,
            [
                colegioId,
                asesorId
            ]);

        const planId =
            nuevo.insertId;

        for(let i=1;i<=8;i++){

            await db.query(`
                INSERT INTO
                plan_inducciones
                (
                    plan_id,
                    numero_induccion
                )
                VALUES (?,?)
            `,
            [
                planId,
                i
            ]);

        }

        const [resultado] =
            await db.query(`
                SELECT *
                FROM planes_recuperacion
                WHERE id = ?
            `,
            [planId]);

        res.json(resultado[0]);

    }
    catch(err){

        console.error(err);

        res.status(500).json(err);

    }

});

/* =========================
   🚀 INDUCCIONES
========================= */

app.get("/inducciones", async (req,res)=>{

    try{

        const [rows] =
            await db.query(`
                SELECT 
                    id,
                    nombre
                FROM inducciones
                ORDER BY id
            `);

        res.json(rows);

    }
    catch(err){

        console.error(err);

        res.status(500).json({
            error:err.message
        });

    }

});


/* =========================
   📋 TAREAS POR INDUCCIÓN
========================= */

app.get(
"/tareas-induccion/:induccionId",
async(req,res)=>{

    try{

        const induccionId =
            req.params.induccionId;

        const [rows] =
            await db.query(`
                SELECT
                    id,
                    descripcion
                FROM tareas_induccion
                WHERE induccion_id = ?
                ORDER BY id
            `,
            [induccionId]);

        res.json(rows);

    }
    catch(err){

        console.error(err);

        res.status(500).json({
            error:err.message
        });

    }

});

/* =====================================================
   📊 DASHBOARD USO DE MÓDULOS
===================================================== */

app.get("/modulos-uso", async (req, res) => {

    try {

        const { asesor, colegio, fecha, nivel } = req.query;

        let filtros = [];
        let valores = [];


        if (asesor) {
            filtros.push(
                "d.asesor_id = ?"
            );
            valores.push(asesor);
        }


        if (colegio) {
            filtros.push(
                "d.colegio_id = ?"
            );
            valores.push(colegio);
        }


        if (nivel) {
            filtros.push(
                "d.nivel = ?"
            );
            valores.push(nivel);
        }


        if (fecha === "30") {

            filtros.push(
                "d.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
            );

        }


        if (fecha === "90") {

            filtros.push(
                "d.fecha >= DATE_SUB(NOW(), INTERVAL 90 DAY)"
            );

        }


        let where =
            filtros.length
            ? "WHERE " + filtros.join(" AND ")
            : "";


        const [datos] =
        await db.query(
        `
        SELECT

            c.modulo,

            ROUND(
                AVG(dd.puntaje) / 4 * 100,
                1
            ) AS porcentaje,

            COUNT(DISTINCT d.id)
            AS evaluaciones


        FROM diagnostico_detalle dd


        INNER JOIN criterios_diagnostico c
        ON dd.criterio_id = c.id


        INNER JOIN diagnosticos d
        ON dd.diagnostico_id = d.id


        ${where}


        GROUP BY c.modulo

        ORDER BY porcentaje DESC

        `,
        valores
        );


        res.json(datos);


    } catch(error) {

        console.log(error);

        res.status(500).json({
            error:"Error obteniendo módulos"
        });

    }

});



/* =========================
   🚀 SERVER
========================= */

const PORT =
    process.env.PORT || 3000;


app.listen(PORT,()=>{

    console.log(
        "🚀 Servidor iniciado en puerto "
        + PORT
    );

});