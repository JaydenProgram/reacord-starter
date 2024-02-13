
const { Embed } = require("reacord");


function FancyMessage({ title, description, imageUrl, color }) {
    return (
        <Embed
            title={title}
            description={description}
            color={color}
            image={
                imageUrl 
                    ? { url: imageUrl.toString() } 
                    : imageUrl === ""
                        ? { url: 'https://i.pinimg.com/736x/8d/53/f4/8d53f47ee07e149e0bbf043db72ccc98.jpg' } 
                        : null
            }
        />
    );
}

module.exports = { FancyMessage };