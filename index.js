//require the express nodejs module
var express = require('express'),
    //set an instance of exress
    app = express();
// A proceses schedule for execin another time;

const schedule = { pending: [], inExecution: null, done: [] };

function book(task) {
    task ? schedule.pending.push(task) : null;
    if (schedule.pending.length > 0 && schedule.inExecution === null) {
        const pending = schedule.pending.length < 2 ? schedule.pending[0] : schedule.pending.sort((a, b) => b > a ? -1 : 1)[0];
        const index = schedule.pending.findIndex(p => p.processId === pending.processId);
        schedule.inExecution = pending;
        schedule.pending.splice(index, 1);
        schedule.inExecution.startAt = new Date;
        schedule
            .inExecution
            .process({ test: "test" })
            .then(data => {
                schedule.done.push(
                    Object.assign({}, schedule.inExecution, { success: true, result: data || 'success', doneAt: new Date() })
                )
                schedule.inExecution = null;
                book();
            })
            .catch(error => {
                let _error = error;
                if (_error.constructor === Error) {
                    _error = error.getMessage();
                }
                schedule.done.push(
                    Object.assign({}, schedule.inExecution, { success: false, result: _error || 'error', doneAt: new Date() })
                )
                schedule.inExecution = null;
                book();
            })
    }
}


//tell express what to do when the / route is requested
app.get('/', function (req, res) {
    res.status(200).send(JSON.stringify(schedule, null, 4));
});

app.get("/book-task", (req, res) => {
    const task = {
        company: "",
        process: date => new Promise((resolve, reject) => {
            console.log(null, "teste1", { now: new Date, date });
            setTimeout(() => {
                if (Number.parseInt(Math.random() * 100) % 2 == 0) {
                    reject({ res: "noting with love", date })
                } else {
                    resolve({ res: "done with love", date })
                }
            }, 10000);
        }),
        processId: Math.random().toString(36).slice(2),
        date: Date.now(),
        scheduledAt: new Date(),
        _data: {}
    };
    book(task);
    res.status(200).send(JSON.stringify(schedule));
})

app.get("/task-status/:_taskId", (req, res) => {
    const _taskId = req.params._taskId;
    if (schedule.inExecution !== null)
        if (schedule.inExecution.processId === _taskId) {
            return res.status(200).send("Your task is in execution since " + schedule.inExecution.startAt + "(:^)")
        }
    const pendingTask = schedule.pending.find(s => s.processId === _taskId);
    const doneTask = schedule.done.find(s => s.processId === _taskId);
    if (!doneTask && pendingTask) {
        return res.status(200).send("Your task is pending since " + pendingTask.scheduledAt + " :/")
    } else if (doneTask && !pendingTask) {
        return res.status(200).send("Your task has done at " + doneTask.doneAt + " :)");
    } else if (!doneTask && !pendingTask) {
        return res.status(200).send("OMG, task not found :(")
    }

})

//wait for a connection
app.listen(3005, 'localhost', function () {
    console.log('The web server is running. Please open http://localhost:3005/ in your browser.');
});