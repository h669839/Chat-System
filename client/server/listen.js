module.exports = {
    listen: function(app, port) {
       app.listen(port, () => {
            let d = new Date();
            let h = d.getHours();
            let m = d.getMinutes();
            console.log('Server has been started on port ' 
                + port + ' at ' + h + ':' + m);
        });
    }
}