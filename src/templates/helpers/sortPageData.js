module.exports = arrayObj =>
    arrayObj.map(value => {
        let newPage = value.page.sort(function (current, next) {
            var currentName = current.name.toLowerCase(), nextName = next.name.toLowerCase()
            if (currentName < nextName) {
                return -1;
            } //sort string ascending
            if (currentName > nextName) {
                return 1;
            }
            return 0; //default return value (no sorting)
        });


        let compareChar = newPage[0] && newPage[0].name && newPage[0].name[0]
            && newPage[0].name[0].toLowerCase && newPage[0].name[0].toLowerCase();

        for (let i = 0; i < newPage.length; i++) {
            let page = newPage[i];
            if (i === 0 || compareChar !== page.name[0].toLowerCase() && !page.alpha) {
                newPage.splice(i, 0, { "alpha": page.name[0].toUpperCase() });
            }
            compareChar = page.name[0].toLowerCase();
        }

        value.page = newPage;

        return value;
    });