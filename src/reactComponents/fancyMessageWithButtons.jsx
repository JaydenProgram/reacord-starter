const { Embed, Button, ActionRow } = require("reacord");

function FancyMessageWithButtons({ title, description, imageUrl, color, buttons }) {
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
        >
            {buttons && buttons.length > 0 && (
                <ActionRow>
                    {buttons.map((button, index) => (
                        <Button key={index} label={button.label} customId={button.customId} onClick={button.onClick} />
                    ))}
                </ActionRow>
            )}
        </Embed>
    );
}

module.exports = { FancyMessageWithButtons };