const user = require("./cmds_user.js");
const quiz = require("./cmds_quiz.js");
const favs = require("./cmds_favs.js");
const readline = require('readline');

/*
  El alumno debe modificar el proyecto proporcionado para convertirlo en un servidor que atienda 
  peticiones TCP en el puerto 8080. Con la nueva versión, para utilizar el programa deberá arrancarse 
  un cliente telnet (o netcat) conectado a la dirección y puerto del servidor. Usando dicho cliente 
  deberán poderse ejecutar los mismos comandos que anteriormente y su comportamiento será idéntico, 
  recibiendo los resultados de su ejecución también en el cliente. Además se exige el requisito de que 
  puedan conectarse varios clientes y utilizar el programa de manera simultánea.
*/
const net = require('net');

/*
   •	Modificar el programa para que al ejecutarlo arranque un socket TCP escuchando peticiones en el puerto 8080.
*/
const host = "localhost";
const port = 8080;

let socketGamers = []; // Sockets de Jugadores

let server = net.createServer(
    (socket) => {

        socketGamers.push(socket); // Incluimos un nuevo jugador

        socket.on('end', () => {
            let i = socketGamers.indexOf(socket);
            console.log(`{end} => Jugador [${i}] -> ${socketGamers[i].remoteAddress}:${socketGamers[i].remotePort} abandona el juego`)
        });

        socket.on('close', () => {
            let i = socketGamers.indexOf(socket);
            console.log(`{close} => Jugador [${i}] -> ${socketGamers[i].remoteAddress}:${socketGamers[i].remotePort} ya no está jungado`)
            socketGamers.splice(i, 1);
        });

        socket.on('data', (data) => {
            let i = socketGamers.indexOf(socket);
            console.log(`Jugador [${i}] -> ${socketGamers[i].remoteAddress}:${socketGamers[i].remotePort} envío ${data}`);
            for (let k = 0; k < socketGamers.length; ++k) {
                if (socketGamers[k] !== socket)
                    socketGamers[k].write(`Aviso para el Jugador [${k}] :: Jugador [${i}] -> ${socketGamers[k].remoteAddress}:${socketGamers[k].remotePort} envió ${data}\n`)
            };
        });

        socket.on('error', () => {
            let i = socketGamers.indexOf(socket);
            console.log(`{error} => Jugador [${i}] -> ${socketGamers[i].remoteAddress}:${socketGamers[i].remotePort} con un error abandona el juego`)
        });

        const rl = readline.createInterface({
            input: socket, // •	Modificar el programa para que en vez de leer las órdenes en la línea de comandos (stdin) lo haga en la entrada del socket.
            output: socket, // •	Modificar el programa para que en vez de escribir los resultados de la ejecución de las órdenes en la salida estándar (stdout) lo haga en la salida del socket.
            prompt: `Jugador [${socketGamers.length-1}] > ` // Detalle en el prompt
        });

        rl.log = (msg) => { // Add log to rl interface
            console.log("Servidor respondió:\n" + msg);
            socket.write(msg + "\n");
        }
        rl.questionP = function(string) { // Add questionP to rl interface
            return new Promise((resolve) => {
                this.question(`  ${string}: `, (answer) => resolve(answer.trim()))
            })
        };

        rl.prompt();

        rl.on('line', async(line) => { // •	Nota: se debe seguir utilizando el módulo readline.
            try {
                let cmd = line.trim()

                if ('' === cmd) {} //
                else if ('h' === cmd) { user.help(rl); } //
                else if (['lu', 'ul', 'u'].includes(cmd)) { await user.list(rl); } //
                else if (['cu', 'uc'].includes(cmd)) { await user.create(rl); } //
                else if (['ru', 'ur', 'r'].includes(cmd)) { await user.read(rl); } //
                else if (['uu'].includes(cmd)) { await user.update(rl); } //
                else if (['du', 'ud'].includes(cmd)) { await user.delete(rl); } //
                else if (['lq', 'ql', 'q'].includes(cmd)) { await quiz.list(rl); } //
                else if (['cq', 'qc'].includes(cmd)) { await quiz.create(rl); } //
                else if (['tq', 'qt', 't'].includes(cmd)) { await quiz.test(rl); } //
                else if (['uq', 'qu'].includes(cmd)) { await quiz.update(rl); } //
                else if (['dq', 'qd'].includes(cmd)) { await quiz.delete(rl); } //
                else if (['lf', 'fl', 'f'].includes(cmd)) { await favs.list(rl); } //
                else if (['cf', 'fc'].includes(cmd)) { await favs.create(rl); } //
                else if (['df', 'fd'].includes(cmd)) { await favs.delete(rl); } //
                else if ('e' === cmd) {
                    rl.log('Bye!');
                    rl.close(); // ¿Por qué hay que hacerlo?
                    socket.end(`Vuelve pronto`);
                } else {
                    rl.log('UNSUPPORTED COMMAND!');
                    user.help(rl);
                };
            } catch (err) {
                rl.log(`  ${err}`);
            } finally {
                rl.prompt();
            }
        });
    }
);

/*
•	Al arrancar el programa con la orden npm start (o node main) éste debe quedarse esperando recibir conexiones en el puerto 8080.
•	Arrancando en otro terminal el programa telnet con la orden telnet localhost 8080 (o telnet 127.0.0.1 8080) nos conectaremos al servidor y podremos ejecutar los comandos disponibles.
•	Varios clientes deben poder conectarse y utilizar el programa de manera simultánea.
•	Al cerrar la conexión de un cliente, el servidor debe seguir arrancado esperando nuevas conexiones.
 */

server.listen(port);
console.log(`Servidor de Quizzes en ${host}:${port}`);